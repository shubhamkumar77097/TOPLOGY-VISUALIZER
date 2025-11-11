import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // body should contain { targetUrl, probeId, pair }
    // forward to mock-server bridge
    try {
      await fetch('http://localhost:8082/broadcast', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  } catch {
      // if bridge not available, ignore
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
