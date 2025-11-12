import { NextResponse } from 'next/server';
import { appendRecord, queryRecords } from '@/lib/historyStore';
import { jsonResponse } from '@/lib/apiHelpers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const key = `${body.from}->${body.to}`;
  await appendRecord(key, body);
    return jsonResponse({ ok: true }, req);
  } catch (e) {
    return jsonResponse({ ok: false, error: String(e) }, req, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
  // accept pair in either 'from->to' or 'from__to' formats
  let pair = url.searchParams.get('pair');
  if (pair && pair.includes('__')) pair = pair.replace(/__/g, '->');
  const fromTs = url.searchParams.get('from') ? Number(url.searchParams.get('from')) : undefined;
  const toTs = url.searchParams.get('to') ? Number(url.searchParams.get('to')) : undefined;
  const data = await queryRecords(pair ?? undefined, fromTs, toTs);
  return jsonResponse(data, req);
  } catch (e) {
    return jsonResponse({ ok: false, error: String(e) }, req, { status: 400 });
  }
}

