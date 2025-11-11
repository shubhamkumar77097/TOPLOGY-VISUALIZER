// Client-side export helpers: CSV/JSON/PNG report generation
export async function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function jsonToCsv(items: any[], fields?: string[]) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const keys = fields || Array.from(items.reduce((s, it) => { Object.keys(it).forEach(k => s.add(k)); return s; }, new Set<string>()));
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = keys.join(',');
  const rows = items.map(it => keys.map(k => escape(it[k])).join(','));
  return [header, ...rows].join('\n');
}

export async function exportVisibleJSON(): Promise<void> {
  try {
    // gather store-backed and API-backed visible data
    const locations = await fetch('/api/locations').then(r => r.json()).catch(() => []);
    const regions = await fetch('/api/regions').then(r => r.json()).catch(() => ({}));
    const payload = { exportedAt: Date.now(), locations, regions };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    await downloadBlob('topology-visible.json', blob);
  } catch (e) {
    throw e;
  }
}

export async function exportVisibleCSV(): Promise<void> {
  try {
    const locations = await fetch('/api/locations').then(r => r.json()).catch(() => []);
    const csv = jsonToCsv(locations.map((l: any) => ({ id: l.id, name: l.name, provider: l.provider, city: l.city, lat: l.lat, lng: l.lng, region: l.region_code || l.region })));
    const blob = new Blob([csv], { type: 'text/csv' });
    await downloadBlob('topology-visible.csv', blob);
  } catch (e) {
    throw e;
  }
}

export async function captureCanvasPNG(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // choose the first canvas in the document (the r3f canvas is the main one)
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) return reject(new Error('Canvas element not found'));
      // toDataURL -> blob
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to capture canvas'));
        resolve(blob);
      }, 'image/png');
    } catch (e) { reject(e); }
  });
}

export async function exportPNG(filename = 'topology.png') {
  const blob = await captureCanvasPNG();
  await downloadBlob(filename, blob);
}

export async function generateHtmlReport(): Promise<void> {
  try {
    const locations = await fetch('/api/locations').then(r => r.json()).catch(() => []);
    const regions = await fetch('/api/regions').then(r => r.json()).catch(() => ({}));
    let imgData = '';
    try {
      const blob = await captureCanvasPNG();
      const buf = await blob.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      imgData = 'data:image/png;base64,' + b64;
    } catch (e) {
      imgData = '';
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Topology Report</title></head><body><h1>Topology Report</h1><h2>Generated: ${new Date().toISOString()}</h2>${imgData ? `<h3>Snapshot</h3><img src="${imgData}" style="max-width:100%;height:auto;border:1px solid #ccc"/>` : '<p><em>Snapshot unavailable</em></p>'}<h3>Summary</h3><pre>${JSON.stringify({ locationsCount: (locations||[]).length, regions: regions && regions.features ? regions.features.length : 0 }, null, 2)}</pre><h3>Locations</h3><pre>${JSON.stringify(locations, null, 2)}</pre></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    await downloadBlob('topology-report.html', blob);
  } catch (e) {
    throw e;
  }
}
