import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const base = process.cwd();
    const j = path.resolve(base, 'history.json');
    const s = path.resolve(base, 'history.sqlite');
    const now = Date.now();
    if (fs.existsSync(j)) fs.renameSync(j, `${j}.bak.${now}`);
    if (fs.existsSync(s)) fs.renameSync(s, `${s}.bak.${now}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
