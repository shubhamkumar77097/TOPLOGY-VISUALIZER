import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

function bboxOf(coords:any[]){ let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity; coords.forEach((p:any)=>{ const x=p[0], y=p[1]; if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; }); return [minX,minY,maxX,maxY]; }
function pointInRing(pt:any[], ring:any[]){ const x=pt[0], y=pt[1]; let inside=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1]; const intersect = ((yi>y)!=(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi+0.0)+xi); if(intersect) inside=!inside; } return inside; }
function pointInPoly(point:any[], geom:any){ if(!geom) return false; const t=geom.type; if(t==='Polygon') return pointInRing(point, geom.coordinates[0]); if(t==='MultiPolygon'){ for(const poly of geom.coordinates){ if(pointInRing(point, poly[0])) return true; } return false; } return false; }

export async function GET(){
  try{
    const base = process.cwd();
    const locP = path.resolve(base, 'data', 'exchanges.json');
    const regP = path.resolve(base, 'data', 'provider-regions.json');
    if(!fs.existsSync(locP)) return NextResponse.json({ ok:false, error:'no exchanges.json' }, { status:404 });
    if(!fs.existsSync(regP)) return NextResponse.json({ ok:false, error:'no provider-regions.json' }, { status:404 });
    const locs = JSON.parse(fs.readFileSync(locP,'utf8'));
    const regs = JSON.parse(fs.readFileSync(regP,'utf8'));
    const features = (regs.type==='FeatureCollection')?regs.features:regs;
    const out:any[] = [];
    for(const l of locs){ const pt=[l.lng,l.lat]; const candidates:any[] = [];
      for(const f of features){ const geom = f.geometry || f; if(!geom) continue; let bbox: number[] | null = null;
  try{ if(geom.type==='Polygon') bbox = bboxOf(geom.coordinates[0]); else if(geom.type==='MultiPolygon') bbox = bboxOf(geom.coordinates[0][0]); }catch{}
        let bboxMatch=false, pip=false; if (bbox && bbox.length===4) { const [minX,minY,maxX,maxY] = bbox; if(l.lng>=minX && l.lng<=maxX && l.lat>=minY && l.lat<=maxY) bboxMatch=true; }
  try{ pip = pointInPoly(pt, geom); }catch{}
        if(bboxMatch || pip){ const p = f.properties || f; const code = p && (p.code||p.region||p.iso_a3||p.ADM0_A3||p.ISO_A3||p.iso_a2||p.ISO_A2) || null; candidates.push({ code, name: p && (p.name||p.admin||p.NAME), bboxMatch, pip }); }
      }
      out.push({ id: l.id, name: l.name, lat: l.lat, lng: l.lng, candidates });
    }
    return NextResponse.json({ ok:true, diagnostics: out });
  }catch(e){ return NextResponse.json({ ok:false, error:String(e) }, { status:500 }); }
}
