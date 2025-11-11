// Simple WebSocket mock server that emits random latency updates every 5s
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 });
// Optional lightweight HTTP bridge to accept POSTs and broadcast to WS clients
const http = require('http');
const bodyParser = (req, cb) => {
  let b = '';
  req.on('data', (c) => b += c.toString());
  req.on('end', () => cb(b));
};
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/broadcast') {
    bodyParser(req, (body) => {
      try {
  const obj = JSON.parse(body);
  console.log('Mock HTTP bridge received /broadcast:', obj);
        const msg = JSON.stringify(obj);
  let sent = 0;
  wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) { c.send(msg); sent += 1; } });
  console.log(`Mock HTTP bridge forwarded broadcast to ${sent} client(s)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(8082);

const locations = [
  'binance-aws-tokyo',
  'bybit-aws-singapore',
  'deribit-gcp-netherlands',
  'okx-azure-hongkong',
  'coinbase-other-usa',
];

function randLatency() {
  return Math.round(Math.random() * 200) + 1; // 1-200ms
}

wss.on('connection', (ws) => {
  console.log('client connected');
  const iv = setInterval(() => {
    const from = locations[Math.floor(Math.random() * locations.length)];
    const to = locations[Math.floor(Math.random() * locations.length)];
    if (from === to) return;

    const payload = {
      from,
      to,
      value: randLatency(),
      ts: Date.now(),
    };

    ws.send(JSON.stringify(payload));
  }, 5000);

  ws.on('close', () => clearInterval(iv));
});

console.log('Mock WS server listening on ws://localhost:8081');
console.log('Mock server HTTP bridge listening on http://localhost:8082');
