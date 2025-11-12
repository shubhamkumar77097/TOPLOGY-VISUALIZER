'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export function GlobalApiEndpoints() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isBrowser, setIsBrowser] = React.useState(false);

  React.useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) return null;

  return createPortal(
    <>
      {/* Floating API Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999999] px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          border: 'none',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        title="Quick access to API endpoints"
      >
        <span style={{ fontSize: '18px' }}>🌐</span>
        <span>API</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-[9999998] w-[400px] max-w-[90vw] shadow-2xl rounded-xl"
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '20px',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '20px' }}>🌐</span>
              <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>API Endpoints</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg hover:bg-white/10 transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
          
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            All endpoints open with pretty-printed JSON (pretty=1)
          </p>

          <select
            className="w-full p-3 rounded-lg text-white text-sm cursor-pointer mb-3"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              outline: 'none',
              color: '#ffffff',
            }}
            onChange={(e) => {
              const endpoint = e.target.value;
              if (endpoint) {
                const separator = endpoint.includes('?') ? '&' : '?';
                const urlWithPretty = endpoint + separator + 'pretty=1';
                window.open(urlWithPretty, '_blank');
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled style={{ color: '#ffffff' }}>
              Select an endpoint to visit...
            </option>
            <optgroup label="History">
              <option value="/api/history">GET /api/history - Get history records</option>
              <option value="/api/history/export">GET /api/history/export - Export history CSV</option>
              <option value="/api/history/reset">POST /api/history/reset - Reset history</option>
              <option value="/api/history/prune">POST /api/history/prune - Prune old records</option>
              <option value="/api/history/rollup">GET /api/history/rollup - Get rollup stats</option>
              <option value="/api/history/aggregate">GET /api/history/aggregate - Get aggregated data</option>
              <option value="/api/history/validate">GET /api/history/validate - Validate history</option>
            </optgroup>
            <optgroup label="Locations">
              <option value="/api/locations">GET /api/locations - Get all locations</option>
              <option value="/api/locations/assign">POST /api/locations/assign - Assign location</option>
              <option value="/api/locations/diagnose">GET /api/locations/diagnose - Diagnose locations</option>
            </optgroup>
            <optgroup label="Probes">
              <option value="/api/probes/run">POST /api/probes/run - Run probes</option>
              <option value="/api/probes/trigger">POST /api/probes/trigger - Trigger probe</option>
              <option value="/api/probes/coordinate">POST /api/probes/coordinate - Coordinate probes</option>
              <option value="/api/live-probe">GET /api/live-probe - Live probe data</option>
            </optgroup>
            <optgroup label="Data">
              <option value="/api/regions">GET /api/regions - Get regions</option>
              <option value="/api/volume">GET /api/volume - Get volume data</option>
              <option value="/api/external-latency">GET /api/external-latency - External latency</option>
              <option value="/api/mock-latency">GET /api/mock-latency - Mock latency data</option>
            </optgroup>
            <optgroup label="System">
              <option value="/api/status">GET /api/status - System status</option>
              <option value="/api/ws-test">POST /api/ws-test - Test WebSocket</option>
            </optgroup>
          </select>
        </div>
      )}
    </>,
    document.body
  );
}
