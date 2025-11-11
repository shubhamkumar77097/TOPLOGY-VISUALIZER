// Simple importer to copy authoritative JSON/CSV into project's data/ and optionally import into sqlite via repair-sqlite
// Usage: node scripts/import-data.js --exchanges=path/to/exchanges.json --regions=path/to/regions.json --import-sqlite
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
(async function(){
  const base = process.cwd();
  if (argv.exchanges) {
    const src = path.resolve(argv.exchanges);
    const dst = path.resolve(base, 'data', 'exchanges.json');
    fs.copyFileSync(src, dst);
    console.log('Copied exchanges to', dst);
  }
  if (argv.regions) {
    const src = path.resolve(argv.regions);
    const dst = path.resolve(base, 'data', 'provider-regions.json');
    fs.copyFileSync(src, dst);
    console.log('Copied regions to', dst);
    // optional mapping: --map-prop=PROPERTY_NAME will copy feature.properties[PROPERTY_NAME] into properties.region
    if (argv['map-prop']) {
      try {
        const raw = fs.readFileSync(dst, 'utf8');
        const obj = JSON.parse(raw);
        const features = obj.type === 'FeatureCollection' ? obj.features : obj;
        features.forEach((f) => {
          try {
            if (!f.properties) f.properties = {};
            if (f.properties[argv['map-prop']]) {
              f.properties.region = f.properties[argv['map-prop']];
            }
          } catch { }
        });
        fs.writeFileSync(dst, JSON.stringify(obj, null, 2));
        console.log('Mapped region property from', argv['map-prop']);
      } catch (e) { console.error('Failed to map region property', e); }
    }
  }
  if (argv['import-sqlite']) {
    console.log('Importing into sqlite via repair-sqlite');
    try {
      const r = require('child_process').spawnSync('node', [path.resolve(base, 'scripts', 'repair-sqlite.js')], { stdio: 'inherit' });
      if (r.status !== 0) process.exit(r.status);
      // after repair, try to import locations into sqlite if exchanges.json exists
      const locPath = path.resolve(base, 'data', 'exchanges.json');
      if (fs.existsSync(locPath)) {
        try {
          // use sql.js to open DB and insert locations (await to ensure completion)
          const modSql = await import('sql.js');
          try {
            const initSqlJs = modSql?.default || modSql;
            const SQL = await initSqlJs({});
            const dbFile = path.resolve(base, 'history.sqlite');
            const buf = fs.existsSync(dbFile) ? fs.readFileSync(dbFile) : null;
            const db = buf ? new SQL.Database(new Uint8Array(buf)) : new SQL.Database();
            db.run('CREATE TABLE IF NOT EXISTS locations (id TEXT PRIMARY KEY, name TEXT, city TEXT, lat REAL, lng REAL, provider TEXT, region_code TEXT);');
            // include region_code when available to preserve assignments
            const insert = db.prepare('INSERT OR REPLACE INTO locations (id, name, city, lat, lng, provider, region_code) VALUES (?, ?, ?, ?, ?, ?, ?)');
            const data = JSON.parse(fs.readFileSync(locPath, 'utf8'));
            data.forEach((l) => { try { insert.run([l.id, l.name, l.city, l.lat, l.lng, l.provider, (l.region_code || null)]); } catch { } });
            try { insert.free(); } catch { }
            // assign regions if provider-regions.json exists
            const regionsPath = path.resolve(base, 'data', 'provider-regions.json');
            if (fs.existsSync(regionsPath)) {
              try {
                const regions = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
                const features = regions.features || regions;
                // prefer turf booleanPointInPolygon for robust point-in-polygon
                let booleanPointInPolygon = null;
                try { const modTurf = await import('@turf/boolean-point-in-polygon'); booleanPointInPolygon = modTurf.default || modTurf; } catch { }
                function pointInPoly(pt, poly) {
                  if (booleanPointInPolygon) {
                    const turfPoint = { type: 'Feature', geometry: { type: 'Point', coordinates: pt } };
                    const turfPoly = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [poly] } };
                    try { return booleanPointInPolygon(turfPoint, turfPoly); } catch { }
                  }
                  const x = pt[0], y = pt[1];
                  let inside = false;
                  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
                    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
                    if (intersect) inside = !inside;
                  }
                  return inside;
                }
                const rows = db.exec('SELECT id, lat, lng FROM locations');
                if (rows && rows[0] && rows[0].values) {
                  const update = db.prepare('UPDATE locations SET region_code = ? WHERE id = ?');
                  // precompute centroids for each feature to use as nearest-region fallback
                  const featureCentroids = (features || []).map((f) => {
                    try {
                      // if GeoJSON feature
                      if (f && f.geometry) {
                        const geom = f.geometry;
                        let poly = null;
                        if (geom.type === 'Polygon') poly = geom.coordinates[0];
                        else if (geom.type === 'MultiPolygon') poly = geom.coordinates[0][0];
                        if (poly && poly.length) {
                          let cx = 0, cy = 0;
                          poly.forEach((p) => { cx += p[0]; cy += p[1]; });
                          cx /= poly.length; cy /= poly.length;
                          const code = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || null;
                          return { code, centroid: [cx, cy] };
                        }
                      }
                      // if simple provider region object with bounds
                      if (f && f.bounds && Array.isArray(f.bounds) && f.bounds.length === 2) {
                        const a = f.bounds[0]; const b = f.bounds[1];
                        let minLat, maxLat, minLng, maxLng;
                        if (Math.abs(a[0]) > 90) {
                          // bounds stored as [lng, lat]
                          minLng = Math.min(a[0], b[0]); maxLng = Math.max(a[0], b[0]);
                          minLat = Math.min(a[1], b[1]); maxLat = Math.max(a[1], b[1]);
                        } else {
                          // bounds stored as [lat, lng]
                          minLat = Math.min(a[0], b[0]); maxLat = Math.max(a[0], b[0]);
                          minLng = Math.min(a[1], b[1]); maxLng = Math.max(a[1], b[1]);
                        }
                        const cx = (minLng + maxLng) / 2; const cy = (minLat + maxLat) / 2;
                        const code = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || null;
                        return { code, centroid: [cx, cy] };
                      }
                    } catch { /* ignore centroid calc errors */ }
                    return null;
                  }).filter(Boolean);

                  function haversine(lat1, lon1, lat2, lon2) {
                    const toRad = (v) => v * Math.PI / 180;
                    const R = 6371e3; // meters
                    const φ1 = toRad(lat1), φ2 = toRad(lat2);
                    const Δφ = toRad(lat2 - lat1);
                    const Δλ = toRad(lon2 - lon1);
                    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return R * c;
                  }
                  rows[0].values.forEach((r) => {
                    const id = r[0]; const lat = r[1]; const lng = r[2];
                    let rc = null;
                    for (const f of features) {
                      // compute bounding box of feature
                      let poly = null;
                      if (f.geometry) {
                        const geom = f.geometry;
                        if (geom.type === 'Polygon') poly = geom.coordinates[0];
                        else if (geom.type === 'MultiPolygon') poly = geom.coordinates[0][0];
                      }
                      // if feature provides simple bounds, prefer that
                      if (f.bounds && Array.isArray(f.bounds) && f.bounds.length === 2) {
                        const a = f.bounds[0]; const b = f.bounds[1];
                        // detect order: if first value > 90 or < -90 it's probably lng first
                        if (Math.abs(a[0]) > 90) {
                          // bounds stored as [lng, lat]
                          const minLng = Math.min(a[0], b[0]); const maxLng = Math.max(a[0], b[0]);
                          const minLat = Math.min(a[1], b[1]); const maxLat = Math.max(a[1], b[1]);
                          if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
                            rc = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || null; break;
                          }
                        } else {
                          // bounds stored as [lat, lng]
                          const minLat = Math.min(a[0], b[0]); const maxLat = Math.max(a[0], b[0]);
                          const minLng = Math.min(a[1], b[1]); const maxLng = Math.max(a[1], b[1]);
                          if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
                            rc = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || null; break;
                          }
                        }
                      }
                      // fallback: polygon contains test
                      if (poly && pointInPoly([lng, lat], poly)) { rc = (f.properties && (f.properties.code || f.properties.region)) || (f.region || f.code) || null; break; }
                    }
                    // if no rc found, pick the nearest region centroid (best-effort)
                    if (!rc && featureCentroids.length) {
                      try {
                        let best = null; let bestD = Infinity;
                        featureCentroids.forEach((fc) => {
                          const [cx, cy] = fc.centroid; // cx=lng, cy=lat
                          const d = haversine(lat, lng, cy, cx);
                          if (d < bestD) { bestD = d; best = fc; }
                        });
                        if (best) rc = best.code;
                      } catch { /* ignore */ }
                    }

                    try { update.run([rc, id]); } catch { /* ignore individual update errors */ }
                  });
                  try { update.free(); } catch { }
                }
              } catch (e) { console.error('Failed to assign regions', e); }
            }
            const out = db.export();
            fs.writeFileSync(dbFile, Buffer.from(out));
            console.log('Imported locations into sqlite');
          } catch (e) {
            console.error('Failed to import into sqlite', e);
          }
          } catch (e) { console.error('Failed to import locations into sqlite', e); }
      }
      process.exit(0);
    } catch (e) {
      console.error('Import failed', e);
      process.exit(2);
    }
  }
})();
