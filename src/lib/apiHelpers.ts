import { NextResponse } from 'next/server';

/**
 * Helper function to return JSON responses with optional pretty printing
 * Checks for 'pretty=1' query parameter
 */
export function jsonResponse(data: any, req: Request, init?: ResponseInit) {
  const url = new URL(req.url);
  const pretty = url.searchParams.get('pretty') === '1';
  
  if (pretty) {
    // Return pretty-printed JSON as HTML for better browser viewing
    const jsonString = JSON.stringify(data, null, 2);
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Response</title>
  <style>
    body {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      background: #1a1a1a;
      color: #f0f0f0;
      padding: 20px;
      margin: 0;
      line-height: 1.6;
    }
    pre {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      font-size: 14px;
    }
    .header {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .copy-btn {
      background: #238636;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .copy-btn:hover {
      background: #2ea043;
    }
    .copy-btn:active {
      background: #1a7f37;
    }
    .endpoint {
      color: #58a6ff;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="endpoint">${url.pathname}</span>
    <button class="copy-btn" onclick="copyToClipboard()">Copy JSON</button>
  </div>
  <pre id="json-content">${escapeHtml(jsonString)}</pre>
  <script>
    function copyToClipboard() {
      const content = document.getElementById('json-content').textContent;
      navigator.clipboard.writeText(content).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy JSON', 2000);
      });
    }
  </script>
</body>
</html>`;
    
    return new Response(html, {
      ...init,
      headers: {
        'Content-Type': 'text/html',
        ...init?.headers,
      },
    });
  }
  
  return NextResponse.json(data, init);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
