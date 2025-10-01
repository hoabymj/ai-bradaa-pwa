// Simple CLI smoke test for Netlify AI function.
// SITE_URL (prod) or DEPLOY_URL (preview) or http://localhost:8888 (Netlify CLI).
const url = process.env.SITE_URL || process.env.DEPLOY_URL || 'http://localhost:8888';
if (!/^https?:\/\//.test(url)) { console.error('Bad SITE_URL/DEPLOY_URL'); process.exit(1); }
(async () => {
  try {
    const res = await fetch(`${url}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': url },
      body: JSON.stringify({ user: 'ping', temperature: 0.2 })
    });
    const json = await res.json().catch(() => ({}));
    console.log('AI', res.status, json);
    process.exit(res.ok ? 0 : 1);
  } catch (e) {
    console.error('AI request failed:', e.message);
    process.exit(1);
  }
})();