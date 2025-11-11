import { NextResponse } from 'next/server';
import { queryRecords, getRecords } from '@/lib/historyStore';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pair = url.searchParams.get('pair') ?? undefined;
    const fromTs = url.searchParams.get('from') ? Number(url.searchParams.get('from')) : undefined;
    const toTs = url.searchParams.get('to') ? Number(url.searchParams.get('to')) : undefined;
  const dataRaw = pair ? await queryRecords(pair, fromTs, toTs) : await getRecords();
  const data = dataRaw;
    const rows: string[] = [];
    if (pair) {
      rows.push('from,to,value,ts');
  (data as any[]).forEach((r: any) => rows.push(`${r.from},${r.to},${r.value},${new Date(r.ts).toISOString()}`));
    } else {
      rows.push('pair,from,to,value,ts');
      Object.entries(data as Record<string, any[]>).forEach(([k, arr]) => {
        (arr || []).forEach((r: any) => rows.push(`${k},${r.from},${r.to},${r.value},${new Date(r.ts).toISOString()}`));
      });
    }

    return new NextResponse(rows.join('\n'), { headers: { 'Content-Type': 'text/csv' } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
