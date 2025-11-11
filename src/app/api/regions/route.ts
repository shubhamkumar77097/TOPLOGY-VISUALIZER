import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import regionsSample from '@/data/regions.sample';

// (ray-cast logic implemented inline where needed)

export async function GET() {
  try {
    const base = process.cwd();
    const regionsPath = path.resolve(base, 'data', 'provider-regions.json');
    let geo: any = regionsSample;
    if (fs.existsSync(regionsPath)) {
      try { geo = JSON.parse(fs.readFileSync(regionsPath, 'utf8')); } catch {}
      // normalize simple array-of-regions (with bounds) into FeatureCollection
  if (Array.isArray(geo)) {
        const feats: any[] = geo.map((r: any) => {
          if (r.bounds && Array.isArray(r.bounds) && r.bounds.length === 2) {
            const a = r.bounds[0]; const b = r.bounds[1];
            // a and b may be [lat,lng] or [lng,lat] — detect by value ranges
            let poly: number[][] = [];
            if (Math.abs(a[0]) > 90) {
              // a = [lng, lat]
              const minLng = Math.min(a[0], b[0]); const maxLng = Math.max(a[0], b[0]);
              const minLat = Math.min(a[1], b[1]); const maxLat = Math.max(a[1], b[1]);
              poly = [[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]];
            } else {
              // a = [lat, lng]
              const minLat = Math.min(a[0], b[0]); const maxLat = Math.max(a[0], b[0]);
              const minLng = Math.min(a[1], b[1]); const maxLng = Math.max(a[1], b[1]);
              poly = [[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]];
            }
            return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] }, properties: { provider: r.provider, region: r.region, code: r.code } };
          }
          return null;
        }).filter(Boolean);
        geo = { type: 'FeatureCollection', features: feats };
      }
    }

    // load locations (try sqlite first)
    let locs: any[] = [];
    try {
      // dynamically import sql.js optionally
      const mod: any = await import('sql.js');
      const initSqlJs = mod?.default || mod;
      const SQL = await initSqlJs({});
      const dbPath = path.resolve(base, 'history.sqlite');
      if (fs.existsSync(dbPath)) {
        const buf = fs.readFileSync(dbPath);
        const db = new SQL.Database(new Uint8Array(buf));
        const rows = db.exec('SELECT id, name, city, lat, lng, provider, region_code FROM locations');
        if (rows && rows[0] && rows[0].values) {
          locs = rows[0].values.map((v: any[]) => ({ id: v[0], name: v[1], city: v[2], lat: v[3], lng: v[4], provider: v[5], region_code: v[6] }));
        }
      }
    } catch {
      // ignore
    }

    // fallback to data/exchanges.json
    if (!locs.length) {
      const p = path.resolve(base, 'data', 'exchanges.json');
      if (fs.existsSync(p)) {
        try { locs = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
      }
    }

  // annotate features: prefer authoritative region_code counts from locations; fallback to polygon test
  // try to load turf boolean PIP (optional) once to avoid awaiting inside map callbacks
  let booleanPointInPolygon: any = null;
  try { const mod: any = await import('@turf/boolean-point-in-polygon'); booleanPointInPolygon = mod.default || mod; } catch {}
  const features = (geo.features || []).map((f: any) => ({ ...f }));
    // build region counts from region_code when available
    const byRegion: Record<string, number> = {};
    locs.forEach((l: any) => { if (l.region_code) byRegion[l.region_code] = (byRegion[l.region_code] || 0) + 1; });
    const out = features.map((f: any) => {
      const code = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || null;
      // skip known placeholder codes (data provider uses -99 widely)
      if (!code || String(code).trim() === '' || String(code).trim() === '-99') return null;
      f.properties = f.properties || {};
      if (code && byRegion[code]) {
        f.properties.serverCount = byRegion[code];
      } else {
            // fallback: compute by polygon contain test
            const geom = f.geometry;
            let polygons: number[][][] = [];
            if (geom && geom.type === 'Polygon') polygons = [geom.coordinates[0]];
            else if (geom && geom.type === 'MultiPolygon') polygons = geom.coordinates.map((c: any) => c[0]);

            // use turf when available or fallback ray-cast
            let count = 0;
            locs.forEach((l: any) => {
              const pt = [l.lng, l.lat];
              if (polygons.some((poly: number[][]) => {
                if (booleanPointInPolygon) {
                  try {
                    const turfPoint = { type: 'Feature', geometry: { type: 'Point', coordinates: pt } };
                    const turfPoly = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] } };
                    return booleanPointInPolygon(turfPoint, turfPoly);
                  } catch { /* fallthrough */ }
                }
                // fallback to simple ray-cast
                let inside = false; const x = pt[0], y = pt[1];
                for (let i=0,j=poly.length-1;i<poly.length;j=i++){
                  const xi=poly[i][0], yi=poly[i][1], xj=poly[j][0], yj=poly[j][1];
                  const intersect = ((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi+0.0)+xi);
                  if (intersect) inside = !inside;
                }
                return inside;
              })) count++;
            });
            f.properties.serverCount = count;
      }
      // decimate large polygons to reduce payload size for clients
      try {
        const geom = f.geometry;
        if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
          const decimate = (pts: number[][]) => {
            if (!pts || pts.length <= 200) return pts;
            const step = Math.ceil(pts.length / 120);
            const outPts: number[][] = [];
            for (let i = 0; i < pts.length; i += step) outPts.push(pts[i]);
            if (outPts.length && (outPts[0][0] !== outPts[outPts.length-1][0] || outPts[0][1] !== outPts[outPts.length-1][1])) outPts.push(outPts[0]);
            return outPts;
          };
          if (geom.type === 'Polygon') geom.coordinates[0] = decimate(geom.coordinates[0]);
          if (geom.type === 'MultiPolygon') geom.coordinates = geom.coordinates.map((mp: any) => [decimate(mp[0])]);
        }
      } catch {}

      // centroid: use polygon centroid (shoelace formula) for better placement
      try {
        const geom = f.geometry;
        let poly: number[][] = [];
        if (geom.type === 'Polygon') poly = geom.coordinates[0];
        else if (geom.type === 'MultiPolygon') poly = (geom.coordinates[0] && geom.coordinates[0][0]) || [];
        if (poly && poly.length) {
          let area = 0; let cx = 0; let cy = 0;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i][0], yi = poly[i][1];
            const xj = poly[j][0], yj = poly[j][1];
            const a = xj * yi - xi * yj;
            area += a;
            cx += (xj + xi) * a;
            cy += (yj + yi) * a;
          }
          area = area / 2;
          if (Math.abs(area) > 1e-9) {
            cx = cx / (6 * area);
            cy = cy / (6 * area);
            f.properties.centroid = [cx, cy];
          } else {
            // fallback to simple average
            let sx = 0, sy = 0;
            poly.forEach((p: number[]) => { sx += p[0]; sy += p[1]; });
            f.properties.centroid = [sx / poly.length, sy / poly.length];
          }
        } else {
          f.properties.centroid = [0, 0];
        }
      } catch {
        f.properties.centroid = [0, 0];
      }
      return f;
    });

    // filter out any nulls we created above
    const filtered = out.filter(Boolean);
    return NextResponse.json({ type: 'FeatureCollection', features: filtered });
  } catch {
    return NextResponse.json({ type: 'FeatureCollection', features: [] });
  }
}
