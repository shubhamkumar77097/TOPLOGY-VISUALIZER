(async ()=>{
  try{
    // use eval('require') so bundlers don't resolve at build time
    const initSqlJs = eval('require')('sql.js');
    const SQL = await initSqlJs({});
    const db = new SQL.Database();
    db.run('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, v TEXT);');
    db.run("INSERT INTO test (v) VALUES ('ok')");
    const res = db.exec('SELECT id,v from test');
    console.log(JSON.stringify(res));
  }catch(e){
    console.error('ERR',e);
    process.exit(1);
  }
})();
