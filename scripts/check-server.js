const http = require('http');
const hosts = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000', 'http://172.20.10.4:3000'];
(async()=>{
  for (const h of hosts) {
    try {
      const res = await new Promise((resolv, rej) => {
        const req = http.get(h + '/api/locations', (res) => {
          let s = ''; res.on('data', (c) => s += c); res.on('end', () => resolv({statusCode: res.statusCode, body: s}));
        });
        req.on('error', (e) => rej(e));
        req.setTimeout(1000, () => { req.destroy(); rej(new Error('timeout')); });
      });
      console.log('OK', h, res.statusCode, res.body.slice(0,200));
    } catch (e) {
      console.log('ERR', h, e.message);
    }
  }
})();
