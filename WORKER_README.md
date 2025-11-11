Worker run instructions

1) Start mock WS server (for demo broadcasts):

```bash
npm run mock-server
```

2) Run the direct worker once:

```bash
npm run worker:run
```

3) Or schedule via PM2 (example runs every minute):

```bash
npm run pm2:start-worker
```

Notes: worker writes to `history.json` or the WASM sqlite store depending on `USE_WASM_SQLITE` env.
