// middleware.js — gates /compass, /tracker, and /dashboard behind a shared
// beta password so the pre-launch POC isn't reachable by anyone who finds
// the URL. Everything else (the landing page, /pricing, /login, /signup,
// /privacy) stays public. This runs on Vercel before the SPA's catch-all
// rewrite, so it can intercept just these three paths without touching the
// rest of the site.
//
// Setup: add an env var called POC_ACCESS_PASSWORD in Vercel (whatever
// password you want testers to use), and run `npm install @vercel/functions`
// so the `next()` helper below is available at build time.

import { next } from '@vercel/functions';

export const config = {
  matcher: ['/compass', '/tracker', '/dashboard'],
};

const COOKIE_NAME = 'cc_poc_access';

const STYLES = `
  body { font-family: 'DM Sans', Helvetica, sans-serif; background: #fafaf8; color: #2d2926; min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; padding: 1.5rem; box-sizing: border-box; }
  .card { background: #fff; border-radius: 1.25rem; border: 1px solid rgba(0,0,0,0.07); padding: 2.5rem; max-width: 380px; width: 100%; box-shadow: 0 8px 40px rgba(0,0,0,0.08); text-align: center; box-sizing: border-box; }
  h1 { font-family: Georgia, serif; font-size: 1.3rem; margin: 0 0 0.5rem; color: #2d2926; }
  p { font-size: 0.9rem; color: #6b6560; line-height: 1.6; margin: 0 0 1.5rem; }
  input { width: 100%; box-sizing: border-box; padding: 0.85rem 1.1rem; border-radius: 0.75rem; border: 1.5px solid rgba(0,0,0,0.12); font-size: 0.97rem; margin-bottom: 0.85rem; font-family: inherit; }
  button { width: 100%; background: #4a7058; color: #fff; border: none; padding: 0.85rem; border-radius: 100px; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: inherit; }
  .err { color: #c0392b; font-size: 0.82rem; margin: -0.5rem 0 0.85rem; }
`;

function gatePage(redirectPath, showError) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Care Compass — Beta Access</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Beta access</h1>
    <p>This part of Care Compass is only open to testers right now. Enter the access password to continue.</p>
    <form method="POST" action="/api/access">
      <input type="hidden" name="redirect" value="${redirectPath}" />
      <input type="password" name="password" placeholder="Access password" autofocus />
      ${showError ? '<p class="err">That password didn’t work — please try again.</p>' : ''}
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;
}

function parseCookies(header) {
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = val;
  });
  return out;
}

export default function middleware(request) {
  const url = new URL(request.url);
  const cookies = parseCookies(request.headers.get('cookie') || '');

  const expected = process.env.POC_ACCESS_PASSWORD;
  const hasAccess = Boolean(expected) && cookies[COOKIE_NAME] === expected;

  if (hasAccess) {
    return next();
  }

  const showError = url.searchParams.get('ccerr') === '1';
  return new Response(gatePage(url.pathname, showError), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
