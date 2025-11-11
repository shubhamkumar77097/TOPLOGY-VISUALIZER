(async ()=>{
  try{
    // import the adapter (compiled TS not necessary since file is JS-compatible)
    const mod = require('../src/lib/historySqliteWasm');
    if (!mod || !mod.queryRecordsSql) { console.error('adapter missing'); process.exit(1); }
    await mod.appendRecordSql('adapter-check',{from:'A',to:'B',value:5,ts:Date.now()});
    const rows = await mod.queryRecordsSql('adapter-check');
    console.log('adapter rows', rows && rows.length ? rows.slice(-3) : rows);
  }catch(e){ console.error('ERR', e); process.exit(1);} 
})();
