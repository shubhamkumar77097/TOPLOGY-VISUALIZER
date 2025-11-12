

### Step 1: Clone Repository & Navigate Into It

```bash
git clone https://github.com/shubhamkumar77097/TOPLOGY-VISUALIZER.git
cd toplogy-visualizer
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment for Live Data

This command creates the `.env.local` file and enables the mock WebSocket connection.

```bash
echo 'NEXT_PUBLIC_USE_LIVE_LATENCY=1
NEXT_PUBLIC_WS_URL=ws://localhost:8081' > .env.local
```
## create a .env file and put ,-> COINGECKO_API_KEY=   ->can get any api from CoinGecko website, sign up for a free account, and get  own personal API key




### Step 4: Seed Sample Data

This creates the necessary data file and populates it with sample measurements.

```bash
npm run seed
```

### Step 5: Run Everything (Requires 2 Terminals)

**Open Terminal 1:** Start the mock data server.

```bash
npm run mock-server
```

**Open Terminal 2:** Start the main application.

```bash
npm run dev
```

---

## ✅ Done!

The application is now running at **[http://localhost:3000](http://localhost:3000)** with live data streaming from the mock server.
