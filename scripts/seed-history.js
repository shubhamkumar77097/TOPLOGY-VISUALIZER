// quick seeder to post some sample records to the local API
const http = require('http');
function post(obj){
  return new Promise((res, rej) => {
    const data = JSON.stringify(obj);
    const opts = { method: 'POST', hostname: 'localhost', port: 3000, path: '/api/history', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = http.request(opts, (r) => { let b=''; r.on('data', c=>b+=c); r.on('end', ()=>res({status:r.statusCode, body:b})); });
    req.on('error', rej); req.write(data); req.end();
  });
}
(async ()=>{
  const now = Date.now();
  const pairs = [ ['a','b'], ['a','c'], ['b','c'] ];
  for(const [f,t] of pairs){
    for(let i=0;i<3;i++){
      const rec = { from: f, to: t, value: Math.random()*200, ts: now - (3-i)*1000 };
      const r = await post(rec);
      console.log('posted', f+'->'+t, r.status);
    }
  }
})();
