(async function(){
  try{
    const mod = await import('sql.js');
    const initSqlJs = mod.default || mod;
    const SQL = await initSqlJs({});
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.resolve(process.cwd(), 'history.sqlite');
    if (!fs.existsSync(dbPath)) { console.log('history.sqlite not found'); process.exit(1); }
    const buf = fs.readFileSync(dbPath);
    const db = new SQL.Database(new Uint8Array(buf));
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='rollups'");
    if (!tableCheck || !tableCheck[0]) { console.log('no rollups table'); process.exit(0); }
    const countRes = db.exec('SELECT COUNT(*) as c FROM rollups');
    const count = countRes && countRes[0] && countRes[0].values && countRes[0].values[0] ? countRes[0].values[0][0] : 0;
    console.log('rollups count:', count);
    const sample = db.exec('SELECT pair,period,bucket,min,max,avg,count FROM rollups LIMIT 10');
    console.log('sample rows:');
    if (sample && sample[0] && sample[0].values) {
      for (const row of sample[0].values) {
        console.log(row);
      }
    } else console.log('no sample rows');
  } catch (e) { console.error('error:', e); process.exit(2); }
})();
