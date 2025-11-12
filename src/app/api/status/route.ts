import { NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/apiHelpers';
import { getRecords } from '@/lib/historyStore';
import os from 'os';

export async function GET(req: Request) {
  const pid = process.pid;
  const mem = process.memoryUsage();
  const cpus = os.cpus().length;
  const histories = await getRecords();
  const pairCount = Object.keys(histories).length;
  return jsonResponse({ ok: true, pid, mem, cpus, pairCount, uptime: process.uptime() }, req);
}
