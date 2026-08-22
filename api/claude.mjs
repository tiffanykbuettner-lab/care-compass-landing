// /api/claude — the single server-side proxy every AI feature in the app
// calls instead of hitting Anthropic directly from the browser. The key
// (ANTHROPIC_API_KEY, no VITE_ prefix so Vite never bundles it into client
// JS) lives only here. Any x-api-key the client sends is ignored — this
// endpoint never trusts a client-supplied key.
//
// Supports both plain JSON responses and SSE streaming passthrough
// (stream: true), since some chat features stream partial replies.
//
// Setup: ANTHROPIC_API_KEY must be set in Vercel → Settings → Environment
// Variables (Production + Preview). No VITE_ prefix.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Per-IP + global rate limiting. In-memory, resets on cold start/redeploy —
// acceptable trade-off for a small known beta group and avoids adding a
// database, consistent with the "no persistent storage" HIPAA posture.
const PER_IP_PER_MINUTE = 20;
const PER_IP_PER_DAY = 80;
const GLOBAL_PER_DAY = 250;

const ipMinuteLog = new Map(); // ip -> [timestamps]
const ipDayLog = new Map(); // ip -> [timestamps]
let globalDayLog = []; // [timestamps]

function pruneOld(arr, windowMs, now) {
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  return arr;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const minuteArr = pruneOld(ipMinuteLog.get(ip) || [], 60 * 1000, now);
  const dayArr = pruneOld(ipDayLog.get(ip) || [], 24 * 60 * 60 * 1000, now);
  globalDayLog = pruneOld(globalDayLog, 24 * 60 * 60 * 1000, now);

  if (minuteArr.length >= PER_IP_PER_MINUTE) return 'Rate limit exceeded. Please wait a moment and try again.';
  if (dayArr.length >= PER_IP_PER_DAY) return 'Daily limit reached for your connection. Please try again tomorrow.';
  if (globalDayLog.length >= GLOBAL_PER_DAY) return 'Daily usage limit reached. Please try again tomorrow.';

  minuteArr.push(now);
  dayArr.push(now);
  globalDayLog.push(now);
  ipMinuteLog.set(ip, minuteArr);
  ipDayLog.set(ip, dayArr);
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured (missing ANTHROPIC_API_KEY).' });
    return;
  }

  const ip = getClientIp(req);
  const rateLimitError = checkRateLimit(ip);
  if (rateLimitError) {
    res.status(429).json({ error: rateLimitError });
    return;
  }

  const { model, max_tokens, system, messages, stream } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Request must include a non-empty messages array.' });
    return;
  }
  if (typeof model !== 'string' || !model.startsWith('claude-')) {
    res.status(400).json({ error: 'Invalid or missing model.' });
    return;
  }

  const cappedMaxTokens = Math.min(Number(max_tokens) || 1000, 8000);

  const anthropicBody = {
    model,
    max_tokens: cappedMaxTokens,
    messages,
    ...(system ? { system } : {}),
    ...(stream ? { stream: true } : {}),
  };

  let anthropicRes;
  try {
    anthropicRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });
  } catch (err) {
    res.status(502).json({ error: 'Could not reach Anthropic API.' });
    return;
  }

  if (stream) {
    res.writeHead(anthropicRes.status, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    if (!anthropicRes.body) {
      res.end();
      return;
    }

    const reader = anthropicRes.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } catch (err) {
      // Client likely disconnected mid-stream; nothing more to do.
    } finally {
      res.end();
    }
    return;
  }

  // Non-streaming: pass the JSON response straight through.
  const data = await anthropicRes.json().catch(() => null);
  if (!data) {
    res.status(502).json({ error: 'Received an invalid response from Anthropic API.' });
    return;
  }
  res.status(anthropicRes.status).json(data);
}
