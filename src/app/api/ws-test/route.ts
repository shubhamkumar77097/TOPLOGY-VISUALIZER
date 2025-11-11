import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({ msg: 'test' }));
    // Forward to the mock server HTTP bridge which listens on 8082
    const res = await fetch('http://localhost:8082/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return NextResponse.json({ ok: false, status: res.status }, { status: 502 });
    const j = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, upstream: j });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST a JSON payload here to broadcast to WS mock server' });
}
