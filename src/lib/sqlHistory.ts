import Database from 'better-sqlite3';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'history.sqlite');
const db = new Database(DB_FILE);

db.exec(`
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT,
  from_loc TEXT,
  to_loc TEXT,
  value INTEGER,
  ts INTEGER
);
`);

export function insertRecord(pair: string, rec: any) {
  const stmt = db.prepare('INSERT INTO history (pair, from_loc, to_loc, value, ts) VALUES (?, ?, ?, ?, ?)');
  stmt.run(pair, rec.from, rec.to, rec.value, rec.ts);
}

export function queryRecords(pair?: string, fromTs?: number, toTs?: number) {
  let sql = 'SELECT * FROM history';
  const clauses: string[] = [];
  const params: any[] = [];
  if (pair) {
    clauses.push('pair = ?');
    params.push(pair);
  }
  if (fromTs) {
    clauses.push('ts >= ?');
    params.push(fromTs);
  }
  if (toTs) {
    clauses.push('ts <= ?');
    params.push(toTs);
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY ts ASC';
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

export function prune(maxRecords = 10000) {
  // Keep only the most recent maxRecords rows
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM history').get();
  const cnt = countRow?.cnt ?? 0;
  if (cnt <= maxRecords) return;
  const toDelete = cnt - maxRecords;
  // delete the oldest 'toDelete'
  db.prepare(`DELETE FROM history WHERE id IN (SELECT id FROM history ORDER BY ts ASC LIMIT ?)`)
    .run(toDelete);
}
