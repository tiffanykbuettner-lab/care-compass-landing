// /api/access — checks the shared POC beta password and, if correct, sets
// an httpOnly cookie so middleware.js lets the visitor through to
// /compass, /tracker, and /dashboard without re-entering it every visit.
//
// Setup: same POC_ACCESS_PASSWORD env var as middleware.js uses.

const COOKIE_NAME = 'cc_poc_access';
const COOKIE_MAX_AGE_DAYS = 45; // comfortably covers the beta window

// Very light brute-force throttle on password attempts — same in-memory,
// resets-on-cold-start trade-off as /api/claude.mjs. Good enough to slow
// down guessing, not a substitute for a strong password.
const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const attemptLog = new Map(); // ip -> [timestamps]

function pruneOld(arr, windowMs, now) {
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  return arr;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const expectedPassword = process.env.POC_ACCESS_PASSWORD;
  if (!expectedPassword) {
    res.status(500).send('Access gate is not configured.');
    return;
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const attempts = pruneOld(attemptLog.get(ip) || [], ATTEMPT_WINDOW_MS, now);
  if (attempts.length >= ATTEMPT_LIMIT) {
    res.status(429).send('Too many attempts. Please wait a few minutes and try again.');
    return;
  }

  const { password, redirect } = req.body || {};
  const safeRedirect =
    typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/compass';

  if (password !== expectedPassword) {
    attempts.push(now);
    attemptLog.set(ip, attempts);
    res.writeHead(302, { Location: `${safeRedirect}?ccerr=1` });
    res.end();
    return;
  }

  const cookie = [
    `${COOKIE_NAME}=${expectedPassword}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}`,
  ].join('; ');

  res.writeHead(302, {
    'Set-Cookie': cookie,
    Location: safeRedirect,
  });
  res.end();
}
