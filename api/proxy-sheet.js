// Vercel Serverless Function for /api/proxy-sheet
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const defaultUrl = 'https://script.google.com/macros/s/AKfycbwMSnZP2rQdireo5jHzbXExCroRsdXp4JvCY8gxBgxePSDwVcRpW9u6lQkSdb8BiRFj/exec';
  const targetUrl = (req.query && req.query.url) || (req.body && req.body.targetUrl) || defaultUrl;

  try {
    if (req.method === 'POST') {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      });

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.status(200).json(json);
      } catch {
        res.status(200).json({ status: 'success', raw: text });
      }
      return;
    }

    // GET
    const action = (req.query && req.query.action) || 'get_schedule';
    const separator = targetUrl.includes('?') ? '&' : '?';
    const fullUrl = `${targetUrl}${separator}action=${action}`;

    const response = await fetch(fullUrl);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
