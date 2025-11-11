"use client";
import React from 'react';

export default function RangeSlider({ min=0, max=1000, step=10, value=[0,1000], onChange }:{ min?:number; max?:number; step?:number; value?:[number,number]; onChange:(v:[number,number])=>void }){
  const [a,b] = value;
  return (
    <div className="relative w-full h-6">
      <input type="range" min={min} max={max} step={step} value={a} onChange={(e)=>{ const nv = Math.min(Number(e.target.value), b- (step||1)); onChange([nv,b]); }} className="absolute inset-0 w-full" />
      <input type="range" min={min} max={max} step={step} value={b} onChange={(e)=>{ const nv = Math.max(Number(e.target.value), a + (step||1)); onChange([a,nv]); }} className="absolute inset-0 w-full" />
      <div className="text-xs text-gray-300 mt-6">{a} - {b} ms</div>
    </div>
  );
}
