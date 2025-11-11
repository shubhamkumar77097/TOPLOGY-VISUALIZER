import fs from 'fs';
import path from 'path';
import { appendRecordSql, queryRecordsSql, getAllPairsSql, dbRunPrune } from './historySqliteWasm';

const DATA_FILE = path.resolve(process.cwd(), 'history.json');
const MAX_RECORDS = 20000;

type Rec = { from: string; to: string; value: number; ts: number };

const USE_WASM = process.env.USE_WASM_SQLITE === '1';

function safeRead(): Record<string, Rec[]> {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function safeWrite(obj: Record<string, Rec[]>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    // ignore write errors for demo
  }
}

export async function appendRecord(pair: string, rec: Rec) {
  if (USE_WASM) {
    try {
      await appendRecordSql(pair, rec);
      return;
    } catch (e) {
    // fall back to file store on error
    console.warn('WASM sqlite append failed, falling back to file store', e);
    }
  }

  const store = safeRead();
  if (!store[pair]) store[pair] = [];
  store[pair].push(rec);
  // keep last 500 per pair
  store[pair] = store[pair].slice(-500);

  // global prune if necessary
  const total = Object.values(store).reduce((s, arr) => s + arr.length, 0);
  if (total > MAX_RECORDS) {
    // naive pruning: remove oldest entries across pairs
    const all: { pair: string; rec: Rec }[] = [];
    Object.entries(store).forEach(([k, arr]) => {
      arr.forEach((r) => all.push({ pair: k, rec: r }));
    });
    all.sort((a, b) => a.rec.ts - b.rec.ts);
    const toKeep = all.slice(-MAX_RECORDS);
    const newStore: Record<string, Rec[]> = {};
    toKeep.forEach((it) => {
      if (!newStore[it.pair]) newStore[it.pair] = [];
      newStore[it.pair].push(it.rec);
    });
    safeWrite(newStore);
    return;
  }

  safeWrite(store);
}

export async function pruneHistory(keepPerPair = 500) {
  if (USE_WASM) {
    try {
      // sql adapter: delete older rows per pair
      const pairs = await getAllPairsSql();
      for (const p of pairs) {
        const rows = await queryRecordsSql(p);
        if (rows.length > keepPerPair) {
          const excess = rows.length - keepPerPair;
          // delete oldest excess
          // sql.js does not support parameterized delete here; run a simple query
          const idsToDelete = rows.slice(0, excess).map((r:any) => r.rowid).filter(Boolean);
          if (idsToDelete.length) {
            dbRunPrune(idsToDelete);
          }
        }
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  // file-backed prune
  const store = safeRead();
  Object.keys(store).forEach((k) => { store[k] = (store[k] || []).slice(-keepPerPair); });
  safeWrite(store);
  return { ok: true };
}

export async function getRecords(pair?: string) {
  if (USE_WASM) {
    try {
      if (pair) {
        const rows = await queryRecordsSql(pair);
        return rows.map((r: any) => ({ from: r.from_id, to: r.to_id, value: r.value, ts: r.ts }));
      }
      // return as map
      const pairs = await getAllPairsSql();
      const out: Record<string, Rec[]> = {};
      for (const p of pairs) {
        const rows = await queryRecordsSql(p);
        out[p] = rows.map((r: any) => ({ from: r.from_id, to: r.to_id, value: r.value, ts: r.ts }));
      }
      return out;
    } catch (e) {
      console.warn('WASM sqlite getRecords failed, falling back', e);
    }
  }
  const store = safeRead();
  if (pair) return store[pair] ?? [];
  return store;
}

export async function queryRecords(pair?: string, fromTs?: number, toTs?: number) {
  if (USE_WASM) {
    try {
      const rows = await queryRecordsSql(pair, fromTs, toTs);
      return rows.map((r: any) => (pair ? { from: r.from_id, to: r.to_id, value: r.value, ts: r.ts } : { pair: r.pair, from: r.from_id, to: r.to_id, value: r.value, ts: r.ts }));
    } catch (e) {
      console.warn('WASM sqlite query failed, falling back', e);
    }
  }

  const store = safeRead();
  if (pair) {
    const arr = store[pair] ?? [];
    return arr.filter((r) => (fromTs ? r.ts >= fromTs : true) && (toTs ? r.ts <= toTs : true)).sort((a, b) => a.ts - b.ts);
  }
  // flatten and attach pair
  const all: (Rec & { pair: string })[] = [];
  Object.entries(store).forEach(([k, arr]) => {
    arr.forEach((r) => all.push({ pair: k, ...r }));
  });
  return all.filter((r) => (fromTs ? r.ts >= fromTs : true) && (toTs ? r.ts <= toTs : true)).sort((a, b) => a.ts - b.ts);
}
