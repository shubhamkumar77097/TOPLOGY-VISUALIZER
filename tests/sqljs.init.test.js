test('sql.js initializes', async () => {
  const initSqlJs = eval('require')('sql.js');
  const SQL = await initSqlJs({});
  const db = new SQL.Database();
  db.run('CREATE TABLE IF NOT EXISTS t (id INTEGER)');
  const res = db.exec('SELECT name FROM sqlite_master WHERE type="table" AND name="t"');
  expect(res && res.length).toBeGreaterThan(0);
});
