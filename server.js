import http from 'http';
import { URL } from 'url';
import fetch from 'node-fetch'; // Use node-fetch for consistency in Node.js environments

const PROXY_PORT = 3001; // Different port from Vite's 3000

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (requestUrl.pathname === '/api/validate-openai-key' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { openAIKey } = JSON.parse(body);

        if (!openAIKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'OpenAI key is required.' }));
          return;
        }

        // Call OpenAI API to list models (a lightweight validation)
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
        });

        const openaiData = await openaiResponse.json();

        if (openaiResponse.ok) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'API key validated successfully.', timestamp: new Date().toISOString() }));
        } else {
          // OpenAI API returns 401 for invalid key, or other errors
          const errorMessage = openaiData.error?.message || 'Invalid API key or OpenAI service error.';
          res.writeHead(openaiResponse.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: errorMessage }));
        }
      } catch (error) {
        console.error('Proxy error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Internal server error during validation.' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`Proxy server running on http://localhost:${PROXY_PORT}`);
});