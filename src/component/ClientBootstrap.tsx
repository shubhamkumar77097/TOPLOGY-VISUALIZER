"use client";
import { useEffect } from 'react';

export default function ClientBootstrap() {
  useEffect(() => {
    try {
      const flag = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_USE_SERVER_PROBE === '1' || process.env.NEXT_PUBLIC_USE_SERVER_PROBE === 'true');
      (window as any).__TV_USE_SERVER_PROBE = flag;
    } catch {}
  }, []);
  return null;
}
