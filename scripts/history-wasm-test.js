(async ()=>{
  try{
    process.env.USE_WASM_SQLITE = '1';
    const { appendRecordSql, queryRecordsSql, persist } = require('../src/lib/historySqliteWasm');
    await appendRecordSql('smoke-pair',{from:'S',to:'T',value:77,ts:Date.now()});
    const rows = await queryRecordsSql('smoke-pair');
    console.log('ROWS', rows.length, rows.slice(-3));
    persist();
  }catch(e){
    console.error('ERR',e);
    process.exit(1);
  }
})();
