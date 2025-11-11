import { NextResponse } from 'next/server';
import { pruneHistory } from '@/lib/historyStore';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const keep = body.keepPerPair || 500;
  const res = await pruneHistory(keep);
  return NextResponse.json(res);
}
