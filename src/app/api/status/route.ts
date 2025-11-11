import { NextResponse } from 'next/server';
import { getRecords } from '@/lib/historyStore';
import os from 'os';

export async function GET() {
  const pid = process.pid;
  const mem = process.memoryUsage();
  const cpus = os.cpus().length;
  const histories = await getRecords();
  const pairCount = Object.keys(histories).length;
  return NextResponse.json({ ok: true, pid, mem, cpus, pairCount, uptime: process.uptime() });
}
