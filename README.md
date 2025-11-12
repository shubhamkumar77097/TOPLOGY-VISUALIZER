# 🌍 Latency Topology Visualizer

A Next.js application that displays a stunning 3D world map visualizing exchange server locations and real-time/historical latency data across AWS, GCP, and Azure co-location regions for cryptocurrency trading infrastructure.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.181.1-black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎯 What's Included](#-whats-included)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🏃 Running the Application](#-running-the-application)
- [🎮 Using the Application](#-using-the-application)
- [🔧 Advanced Setup](#-advanced-setup)
- [📊 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [🌐 Deployment](#-deployment)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [📚 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

## ✨ Features

### 🌐 3D World Map Visualization
- **Interactive 3D Globe**: Smooth rotation, zoom, and pan controls
- **Real-time Rendering**: Powered by Three.js and React Three Fiber
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Camera Presets**: Quick navigation to Asia, Europe, and Americas regions
- **Performance Modes**: Optimized rendering for low-end devices

### 🏦 Exchange Server Locations
- **Major Exchanges**: Binance, Bybit, Deribit, OKX, Coinbase, and more
- **Interactive Markers**: Click or hover for detailed server information
- **Cloud Provider Colors**: Visual distinction between AWS, GCP, and Azure
- **Server Details**: Exchange name, location, region code, and provider
- **Dynamic Filtering**: Filter by exchange or cloud provider

### ⚡ Real-time Latency Monitoring
- **Live Updates**: WebSocket-based real-time latency data
- **Animated Arcs**: Visual connections between server pairs
- **Pulse Effects**: Animated data flow along connection paths
- **Color-Coded Latency**: 
  - 🟢 Green (0-50ms): Excellent
  - 🟡 Yellow (50-150ms): Good
  - 🟠 Orange (150-300ms): Fair
  - 🔴 Red (300ms+): Poor
- **HTTP Fallback**: Automatic fallback when WebSocket unavailable

### 📊 Historical Latency Trends
- **Interactive Charts**: Line charts with Chart.js
- **Time Range Selectors**: 1 hour, 24 hours, 7 days, 30 days
- **Bucket Sizes**: Auto, 1 minute, 10 minutes, 1 hour, 6 hours
- **Statistics Dashboard**: Min, Max, Average, and Count
- **Pair Selection**: Choose any exchange pair to analyze
- **CSV Export**: Download historical data for analysis

### ☁️ Cloud Provider Regions
- **Multi-Cloud Support**: AWS, GCP, and Azure regions
- **Region Boundaries**: GeoJSON-based polygon rendering
- **Region Filtering**: Show/hide specific cloud providers
- **Empty Region Toggle**: Display regions with or without servers
- **Region Statistics**: Server count per region
- **200+ Regions**: Comprehensive global coverage

### 🎨 Visualization Features
- **Heatmap Overlay**: Canvas-based latency heatmap
- **Network Topology**: Connection path visualization
- **Animated Pulses**: Data flow animation
- **Dark/Light Theme**: Toggle between themes with persistence
- **Legend System**: Visual guide for markers and colors
- **Info Panels**: Contextual information display

### 🎛️ Control Panel
- **Collapsible Dashboard**: Clean UI with hamburger menu
- **Filter Options**: 
  - Cloud Providers (AWS, GCP, Azure)
  - Exchanges (All major exchanges)
  - Regions (with search)
- **Display Toggles**:
  - Animated Pulses
  - Heatmap Overlay
  - Show Legend
  - Show Arcs
  - Show Topology
  - Show Regions
  - Low Performance Mode
- **Performance Settings**:
  - Arc Speed (0-200%)
  - Smoothing (0-100%)
  - Latency Range (0-1000ms)
- **Server & Client Probes**: Toggle probe types
- **Settings Persistence**: Save preferences to localStorage

### 📤 Export Functionality
- **CSV Export**: Full history or filtered data
- **JSON Export**: Structured data export
- **PNG Screenshots**: Capture current visualization
- **HTML Reports**: Comprehensive latency reports
- **History Management**: Reset, prune, and validate

### 🌐 API Access
- **Global API Dropdown**: Access all endpoints from any page
- **Pretty Print**: Formatted JSON responses
- **Categorized Endpoints**: History, Locations, Probes, Data, System
- **Copy to Clipboard**: Easy endpoint URL copying

---

## 🎯 What's Included

### ✅ All Core Requirements Implemented
- ✅ 3D World Map Display with interactive controls
- ✅ Exchange Server Locations with markers
- ✅ Real-time Latency Visualization
- ✅ Historical Latency Trends with charts
- ✅ Cloud Provider Regions visualization
- ✅ Interactive Controls and filters
- ✅ Responsive Design for all devices

### ✅ All Bonus Features Implemented
- ✅ Latency Heatmap Overlay
- ✅ Network Topology Visualization
- ✅ Animated Data Flow
- ✅ Dark/Light Theme Toggle
- ✅ Export Functionality (CSV, JSON, PNG, HTML)

### ✅ Technical Excellence
- ✅ TypeScript for type safety
- ✅ Modern React patterns (hooks, context)
- ✅ Optimized 3D rendering
- ✅ Proper error handling
- ✅ Data caching and state management
- ✅ WebSocket with HTTP fallback
- ✅ Performance optimization modes

---

## 🚀 Quick Start

Get up and running in 3 simple steps:

```bash
# 1. Install dependencies
npm install

# 2. Start the application with mock server
npm run dev:with-mock

# 3. Open your browser
# Navigate to http://localhost:3000
```

That's it! The application is now running with a mock WebSocket server providing simulated latency data.

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository ([Download](https://git-scm.com/))

### Verify Installation

```bash
node --version   # Should show v18.0.0 or higher
npm --version    # Should show v9.0.0 or higher
```

### Step-by-Step Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/shubhamkumar77097/TOPLOGY-VISUALIZER.git
cd TOPLOGY-VISUALIZER/toplogy-visualizer
```

#### 2. Install Dependencies

```bash
# Using npm (recommended)
npm install

# Or using npm ci for clean install
npm ci
```

This will install all required dependencies including:
- Next.js 16.0.1
- React 19.2.0
- Three.js 0.181.1
- React Three Fiber
- Chart.js
- Zustand (state management)
- And many more...

#### 3. Verify Installation

```bash
# Check if all dependencies are installed
npm list --depth=0
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory for environment-specific configuration:

```bash
# Copy the example environment file
cp .env.example .env.local
```

#### Available Environment Variables

```bash
# ==============================================
# CORE CONFIGURATION
# ==============================================

# Enable WASM SQLite (optional - for larger datasets)
USE_WASM_SQLITE=0

# ==============================================
# REAL-TIME FEATURES
# ==============================================

# Enable browser-based client probes
NEXT_PUBLIC_USE_LIVE_LATENCY=0

# Enable server-side probes polling
NEXT_PUBLIC_USE_SERVER_PROBES=1

# WebSocket server URL (default: ws://localhost:8080)
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# ==============================================
# EXTERNAL LATENCY API (OPTIONAL)
# ==============================================

# External latency data source URL
EXTERNAL_LATENCY_API_URL=https://example.com/latency

# Poll interval in milliseconds (default: 7000)
NEXT_PUBLIC_EXTERNAL_POLL_MS=7000

# Cache TTL in milliseconds (default: 5000)
EXTERNAL_LATENCY_CACHE_TTL_MS=5000

# Rate limit in milliseconds (default: 1000)
EXTERNAL_LATENCY_RATE_LIMIT_MS=1000

# ==============================================
# PROBE SCHEDULER
# ==============================================

# Probe interval for scheduled runs (default: 60000ms = 1 minute)
PROBE_INTERVAL_MS=60000

# ==============================================
# PERFORMANCE TUNING
# ==============================================

# Node memory allocation (for large datasets)
NODE_OPTIONS=--max_old_space_size=4096
```

### Configuration Files

#### 1. Data Files

The application requires two main data files:

**`data/exchanges.json`** - Exchange server locations
```json
[
  {
    "id": "binance-aws-tokyo",
    "exchange": "Binance",
    "provider": "AWS",
    "region_code": "ap-northeast-1",
    "lat": 35.6762,
    "lng": 139.6503,
    "label": "Tokyo"
  }
]
```

**`data/provider-regions.json`** - Cloud provider regions (GeoJSON)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "region": "JPN",
        "provider": "AWS",
        "name": "Tokyo"
      },
      "geometry": { ... }
    }
  ]
}
```

#### 2. Import Sample Data

```bash
# Import sample exchange and region data
node scripts/import-data.js \
  --exchanges=data/exchanges.sample.json \
  --regions=data/provider-regions.sample.json \
  --import-sqlite

# Or use default paths
npm run import-data
```

---

## 🏃 Running the Application

### Development Mode

#### Option 1: With Mock WebSocket Server (Recommended)

#### Option 1: With Mock WebSocket Server (Recommended)

This starts both the Next.js dev server and a mock WebSocket server that simulates real-time latency data:

```bash
npm run dev:with-mock
```

**What this does:**
- Starts mock WebSocket server on `ws://localhost:8080`
- Starts Next.js dev server on `http://localhost:3000`
- Provides simulated latency data for testing
- Automatically connects to WebSocket for real-time updates

#### Option 2: Next.js Only (No Real-time Data)

Start just the Next.js development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option 3: With WASM SQLite (Advanced)

For larger datasets and better performance:

```bash
npm run dev:wasm
```

**Requirements:**
- `sql.js` must be installed
- More memory allocated (4GB+)
- Suitable for production-scale data

#### Option 4: Separate Servers (Manual Control)

Start servers separately for debugging:

```bash
# Terminal 1: Mock WebSocket server
npm run mock-server

# Terminal 2: Next.js dev server
npm run dev
```

### Production Mode

#### Build for Production

```bash
# Create optimized production build
npm run build
```

#### Start Production Server

```bash
# Start production server
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server only |
| `npm run dev:with-mock` | Start with mock WebSocket server |
| `npm run dev:wasm` | Start with WASM SQLite enabled |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run mock-server` | Run mock WebSocket server only |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run smoke-test` | Quick verification |
| `npm run import-data` | Import exchange/region data |
| `npm run seed-history` | Populate with sample history |
| `npm run prune` | Clean old history data |
| `npm run compute-rollups` | Aggregate historical data |
| `npm run worker:schedule` | Start scheduled probe worker |

---

## 🎮 Using the Application

### First Launch

When you first open the application at [http://localhost:3000](http://localhost:3000), you'll see:

1. **3D Globe**: Interactive Earth with smooth controls
2. **Exchange Markers**: Colored spheres representing servers
3. **Hamburger Menu** (☰): Click to open the control panel
4. **API Button** (🌐): Bottom-right corner for API access

### Navigation Controls

#### Mouse Controls
- **Left Click + Drag**: Rotate the globe
- **Right Click + Drag**: Pan the view
- **Scroll Wheel**: Zoom in/out
- **Hover over marker**: View server details
- **Click marker**: Select for detailed view

#### Touch Controls (Mobile/Tablet)
- **Single Finger Drag**: Rotate
- **Two Finger Pinch**: Zoom
- **Two Finger Drag**: Pan
- **Tap marker**: Select server

### Control Panel Guide

Click the **hamburger menu (☰)** in the top-left to open the dashboard:

#### 1. 📊 Latency Legend
- Color-coded latency ranges
- Shows current connection quality
- Real-time status indicator

#### 2. ☁️ Cloud Providers
- Toggle AWS, GCP, Azure visibility
- Filter by provider
- Show/hide empty regions

#### 3. 🏦 Exchanges
- Select/deselect exchanges
- Filter by specific exchange
- Quick toggle for all exchanges

#### 4. 🗺️ Regions
- Search regions by name
- Filter by region code
- Show server counts

#### 5. 🎨 Display Options
- **Animated Pulses**: Toggle data flow animation
- **Heatmap Overlay**: Show latency heatmap
- **Show Legend**: Toggle legend visibility
- **Show Arcs**: Display connection arcs
- **Show Topology**: Network path visualization
- **Show Regions**: Region boundary display
- **Low Performance Mode**: Optimize for slower devices

#### 6. ⚙️ Performance Settings
- **Arc Speed**: Adjust animation speed (0-200%)
- **Smoothing**: Control arc smoothness (0-100%)
- **Latency Range**: Filter by latency threshold (0-1000ms)
- **Server Probes**: Enable server-side measurements
- **Client Probes**: Enable browser-based probes

#### 7. 📸 Camera Presets
- **Asia**: Quick view of Asian exchanges
- **Europe**: Focus on European servers
- **Americas**: Navigate to American regions

#### 8. 📊 Historical Trends
- **Select Pair**: Choose exchange pair to analyze
- **Time Range**: 1h, 24h, 7d, 30d
- **Bucket Size**: Data aggregation interval
- **Statistics**: Min, Max, Avg, Count
- **Export CSV**: Download historical data

#### 9. 🌐 API Endpoints (Global)
Click the **🌐 API** button (bottom-right) to access:
- **History API**: Historical latency data
- **Locations API**: Exchange locations
- **Regions API**: Cloud provider regions
- **Probes API**: Trigger/view probes
- **System API**: Status and health checks
- **Pretty Print**: Formatted JSON responses

### Export Options (Navbar)

- **Export CSV**: Full history in CSV format
- **Export Visible CSV**: Filtered data only
- **Export Visible JSON**: JSON format export
- **Save PNG**: Screenshot of current view
- **HTML Report**: Comprehensive latency report

### History Management (Navbar)

- **Reset History**: Clear all data (with backup)
- **Prune History**: Remove old entries
- **Validate History**: Check data integrity

### Theme Toggle

Click the **☀️/🌙** icon in the navbar to switch between:
- ☀️ Light Mode: Bright, clean interface
- 🌙 Dark Mode: Easy on the eyes, reduced eye strain

---

## 🔧 Advanced Setup

### Data Import and Management

#### Import Exchange Locations

```bash
# Import from JSON file
node scripts/import-data.js \
  --exchanges=path/to/exchanges.json \
  --import-sqlite

# Import with region assignment
node scripts/import-data.js \
  --exchanges=data/exchanges.json \
  --regions=data/provider-regions.json \
  --import-sqlite
```

#### Import Custom Region Data

```bash
# Import GeoJSON with property mapping
node scripts/import-regions.js /path/to/regions.geojson \
  --map-prop=iso_a3

# This will:
# 1. Copy file to data/provider-regions.json
# 2. Map feature.properties.iso_a3 to feature.properties.region
# 3. Import into SQLite database
# 4. Assign region codes to exchanges
```

#### Seed Historical Data

```bash
# Generate sample historical data for testing
npm run seed-history

# This creates realistic latency history for:
# - Last 7 days
# - Multiple exchange pairs
# - Various time intervals
```

### Server-Side Probes

#### Manual Probe Trigger

```bash
# Trigger a single probe run via API
curl -X POST http://localhost:3000/api/probes/run
```

#### Scheduled Probe Worker

```bash
# Run probes every 60 seconds
PROBE_INTERVAL_MS=60000 npm run worker:schedule

# Or use environment variable
export PROBE_INTERVAL_MS=60000
node scripts/schedule-probes.js
```

#### PM2 Process Manager (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start worker with PM2 (runs every minute)
npm run pm2:start-worker

# Start rollup computation (runs every hour)
npm run pm2:start-rollups

# View PM2 status
pm2 status

# View logs
pm2 logs topology-worker

# Stop workers
pm2 stop topology-worker
pm2 stop topology-rollups

# Remove from PM2
pm2 delete topology-worker
pm2 delete topology-rollups
```

### Database Management

#### Prune Old Data

```bash
# Run once to remove old entries
npm run prune:once

# Run continuously (checks every 5 minutes)
npm run prune
```

#### Compute Rollups (Aggregations)

```bash
# Compute hourly/daily aggregations
npm run compute-rollups

# This creates pre-aggregated data for:
# - Faster historical queries
# - Reduced database load
# - Better chart performance
```

#### Reset Database

```bash
# Reset with backup
node scripts/refresh-history-db.js

# This will:
# 1. Backup existing history.sqlite
# 2. Create fresh database
# 3. Re-import locations
# 4. Assign region codes
```

### External Latency Source Integration

#### Configure External API

```bash
# Set environment variables
export EXTERNAL_LATENCY_API_URL=https://api.example.com/latency
export NEXT_PUBLIC_EXTERNAL_POLL_MS=7000
export EXTERNAL_LATENCY_CACHE_TTL_MS=5000
export EXTERNAL_LATENCY_RATE_LIMIT_MS=1000

# Start dev server
npm run dev
```

#### Enable in UI

1. Open Control Panel (☰)
2. Scroll to "Performance Settings"
3. Enable "External Source" toggle
4. Data will automatically poll and display

#### Supported Response Formats

**Array Format:**
```json
[
  {
    "from": "exchange-a",
    "to": "exchange-b",
    "value": 34,
    "ts": 1699999999999
  }
]
```

**Envelope Format:**
```json
{
  "source": "my-api",
  "data": [
    {
      "f": "exchange-a",
      "t": "exchange-b",
      "avg": 34,
      "ts": 1699999999999
    }
  ]
}
```

**Property Mapping:**
- `from`/`f`/`src` → `from`
- `to`/`t`/`dst` → `to`
- `value`/`avg`/`lat`/`rtt` → `value` (ms)
- `ts`/`time` → `ts`

### Manual Region Assignment

Use the API to manually assign exchanges to regions:

```bash
# Single assignment
curl -X POST http://localhost:3000/api/locations/assign \
  -H "Content-Type: application/json" \
  -d '{
    "assignments": [
      {
        "id": "binance-aws-tokyo",
        "region": "JPN"
      }
    ]
  }'

# Multiple assignments
curl -X POST http://localhost:3000/api/locations/assign \
  -H "Content-Type: application/json" \
  -d '{
    "assignments": [
      {"id": "binance-aws-tokyo", "region": "JPN"},
      {"id": "bybit-gcp-singapore", "region": "SGP"},
      {"id": "deribit-azure-amsterdam", "region": "NLD"}
    ]
  }'
```

### Diagnostics and Debugging

#### Location Assignment Diagnostics

```bash
# Check which locations are ambiguously matched
curl http://localhost:3000/api/locations/diagnose | jq .

# Returns:
# {
#   "ambiguous": [...],
#   "unmatched": [...],
#   "matched": [...]
# }
```

#### Run Smoke Test

```bash
# Quick verification of import → diagnose → assign flow
npm run smoke-test
```

#### Check R3F DOM Issues

```bash
# Verify React Three Fiber DOM setup
npm run check:r3f-dom
```

---

## 📊 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### History API

#### `GET /api/history`
Get historical latency data

**Query Parameters:**
- `pair` (optional): Filter by exchange pair (e.g., "binance→bybit")
- `from` (optional): Filter by source exchange
- `to` (optional): Filter by destination exchange
- `limit` (optional): Number of records (default: 1000)
- `pretty` (optional): Pretty print JSON (add `?pretty=1`)

**Example:**
```bash
curl "http://localhost:3000/api/history?pair=binance→bybit&limit=100&pretty=1"
```

#### `POST /api/history`
Add latency record

**Request Body:**
```json
{
  "pair": "binance→bybit",
  "from": "binance-aws-tokyo",
  "to": "bybit-gcp-singapore",
  "value": 45,
  "ts": 1699999999999
}
```

#### `GET /api/history/aggregate`
Get aggregated historical data

**Query Parameters:**
- `pair` (required): Exchange pair
- `range` (optional): Time range (1h, 24h, 7d, 30d)
- `bucket` (optional): Bucket size (auto, 1m, 10m, 1h, 6h)
- `pretty` (optional): Pretty print

**Example:**
```bash
curl "http://localhost:3000/api/history/aggregate?pair=binance→bybit&range=24h&bucket=1h&pretty=1"
```

### Locations API

#### `GET /api/locations`
Get all exchange locations

**Example:**
```bash
curl "http://localhost:3000/api/locations?pretty=1"
```

#### `GET /api/locations/diagnose`
Diagnose location-region assignments

**Example:**
```bash
curl "http://localhost:3000/api/locations/diagnose?pretty=1"
```

#### `POST /api/locations/assign`
Manually assign regions to locations

**Request Body:**
```json
{
  "assignments": [
    {"id": "exchange-id", "region": "REGION_CODE"}
  ]
}
```

### Regions API

#### `GET /api/regions`
Get cloud provider regions (GeoJSON)

**Example:**
```bash
curl "http://localhost:3000/api/regions?pretty=1"
```

### Probes API

#### `POST /api/probes/run`
Trigger server-side probes (rate-limited)

**Example:**
```bash
curl -X POST "http://localhost:3000/api/probes/run"
```

#### `GET /api/probes/trigger`
Alternative probe trigger endpoint

### System API

#### `GET /api/status`
Get system health status

**Example:**
```bash
curl "http://localhost:3000/api/status?pretty=1"
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1699999999999,
  "uptime": 12345,
  "database": "connected",
  "websocket": "active"
}
```

### Other APIs

#### `GET /api/mock-latency`
Get mock latency data (development only)

#### `GET /api/external-latency`
Proxy to external latency source

#### `GET /api/live`
Server-sent events for live updates

#### `GET /api/live-probe`
Live probe status updates

#### `GET /api/volume`
Get trading volume data

---

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm test -- tests/history.api.test.js

# Run with coverage
npm test -- --coverage
```

### End-to-End Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Run E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test
npx playwright test tests/playwright.smoke.spec.ts
```

### Smoke Test

```bash
# Quick verification test
npm run smoke-test
```

### CI/CD Tests

```bash
# Run all tests (lint + build + unit + E2E)
npm run test:ci
```

### Test Files

| Test File | Description |
|-----------|-------------|
| `tests/history.api.test.js` | History API endpoints |
| `tests/history.aggregate.test.js` | Aggregation logic |
| `tests/regions.api.test.js` | Regions API |
| `tests/probes.run.auth.test.js` | Probe authentication |
| `tests/probes.trigger.test.js` | Probe triggering |
| `tests/realtime.backoff.test.js` | WebSocket reconnection |
| `tests/playwright.smoke.spec.ts` | E2E smoke test |
| `tests/perf.arcs.test.js` | Performance tests |

---

## 🌐 Deployment

### Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### 3. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
USE_WASM_SQLITE=1
NEXT_PUBLIC_USE_SERVER_PROBES=1
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
```

### Docker

#### Build Docker Image

```bash
# Build image
docker build -t latency-visualizer .

# Run container
docker run -p 3000:3000 latency-visualizer
```

#### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - USE_WASM_SQLITE=1
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
```

```bash
docker-compose up -d
```

### Traditional Server

#### 1. Build

```bash
npm run build
```

#### 2. Transfer Files

```bash
# Upload these to your server:
# - .next/
# - public/
# - data/
# - package.json
# - package-lock.json
```

#### 3. Install and Start

```bash
npm ci --production
npm start
```

#### 4. Use PM2 for Process Management

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "latency-visualizer" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### Environment-Specific Configuration

#### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

#### Staging
```bash
NODE_ENV=production
NEXT_PUBLIC_WS_URL=wss://staging-ws.yourdomain.com
```

#### Production
```bash
NODE_ENV=production
USE_WASM_SQLITE=1
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com
NODE_OPTIONS=--max_old_space_size=4096
```

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

#### 2. WebSocket Connection Failed

**Error:** `WebSocket connection to 'ws://localhost:8080' failed`

**Solution:**
```bash
# Make sure mock server is running
npm run mock-server

# Or start with combined command
npm run dev:with-mock
```

#### 3. SQLite Database Locked

**Error:** `database is locked`

**Solution:**
```bash
# Stop all running processes
pkill -f node

# Remove lock file
rm -f data/history.sqlite-shm data/history.sqlite-wal

# Restart application
npm run dev:with-mock
```

#### 4. Out of Memory

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max_old_space_size=4096"
npm run dev

# Or use WASM SQLite
npm run dev:wasm
```

#### 5. Three.js / WebGL Errors

**Error:** `WebGL context lost` or rendering issues

**Solution:**
- Enable "Low Performance Mode" in Control Panel
- Update graphics drivers
- Try a different browser (Chrome recommended)
- Disable hardware acceleration in browser settings

#### 6. Build Errors

**Error:** `Module not found` or TypeScript errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Clear TypeScript build info
rm -f tsconfig.tsbuildinfo

# Rebuild
npm run build
```

#### 7. Data Not Loading

**Issue:** No exchanges or regions visible

**Solution:**
```bash
# Import sample data
npm run import-data

# Or manually import
node scripts/import-data.js \
  --exchanges=data/exchanges.sample.json \
  --regions=data/provider-regions.sample.json \
  --import-sqlite

# Verify data
curl http://localhost:3000/api/locations | jq .
```

### Performance Optimization

#### Slow Rendering

1. Enable "Low Performance Mode" in Control Panel
2. Reduce number of visible exchanges/regions
3. Disable "Animated Pulses"
4. Disable "Heatmap Overlay"
5. Increase "Smoothing" value (reduces arc points)

#### High Memory Usage

1. Use `npm run prune` to clean old history
2. Enable WASM SQLite: `USE_WASM_SQLITE=1`
3. Reduce history retention period
4. Clear browser cache and reload

#### Slow API Responses

1. Run `npm run compute-rollups` to pre-aggregate data
2. Reduce query time ranges
3. Use larger bucket sizes in historical queries
4. Enable database indexing (automatic in SQLite)

### Debugging Tips

#### Enable Debug Logging

```bash
# Set debug environment variable
DEBUG=* npm run dev

# Or specific namespaces
DEBUG=latency:* npm run dev
```

#### Check Browser Console

Open Developer Tools (F12) and check:
- **Console**: JavaScript errors
- **Network**: Failed API requests
- **WebSocket**: Connection status
- **Performance**: Rendering bottlenecks

#### Verify API Responses

```bash
# Test each endpoint
curl http://localhost:3000/api/status | jq .
curl http://localhost:3000/api/locations | jq .
curl http://localhost:3000/api/regions | jq .
curl http://localhost:3000/api/history | jq .
```

#### Database Diagnostics

```bash
# Check database integrity
sqlite3 data/history.sqlite "PRAGMA integrity_check;"

# Check table structure
sqlite3 data/history.sqlite ".schema"

# Count records
sqlite3 data/history.sqlite "SELECT COUNT(*) FROM latency_history;"
```

### Getting Help

If you're still experiencing issues:

1. **Check Logs**: Look for error messages in terminal
2. **GitHub Issues**: Search existing issues or create new one
3. **Documentation**: Re-read relevant sections
4. **Community**: Ask in discussions

---

## 📚 Project Structure

```
toplogy-visualizer/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── api/                      # API routes
│   │   │   ├── history/              # History endpoints
│   │   │   │   ├── route.ts          # GET/POST history
│   │   │   │   └── aggregate/        # Aggregation endpoint
│   │   │   ├── locations/            # Location endpoints
│   │   │   │   ├── route.ts          # GET locations
│   │   │   │   ├── diagnose/         # Diagnostics
│   │   │   │   └── assign/           # Manual assignment
│   │   │   ├── regions/              # Region endpoints
│   │   │   ├── probes/               # Probe endpoints
│   │   │   ├── status/               # Health check
│   │   │   ├── live/                 # SSE endpoint
│   │   │   ├── external-latency/     # External API proxy
│   │   │   └── mock-latency/         # Mock data
│   │   ├── favicon.ico               # Site favicon
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   │
│   ├── component/                    # React components
│   │   ├── Scene.tsx                 # Main 3D scene
│   │   ├── Earth.tsx                 # Earth sphere
│   │   ├── Locations.tsx             # Exchange markers
│   │   ├── LatencyArcs.tsx           # Connection arcs
│   │   ├── Regions.tsx               # Region visualization
│   │   ├── RegionBoundaries.tsx      # Region polygons
│   │   ├── RegionPolygons.tsx        # Polygon renderer
│   │   ├── Heatmap.tsx               # Latency heatmap
│   │   ├── ControlsPanel.tsx         # Main dashboard
│   │   ├── HistoryPanel.tsx          # History viewer
│   │   ├── InfoPanel.tsx             # Info display
│   │   ├── Legend.tsx                # Color legend
│   │   ├── Badges.tsx                # Status badges
│   │   ├── SystemStatus.tsx          # System health
│   │   ├── PairLabel.tsx             # Selected pair label
│   │   ├── RealtimeProvider.tsx      # WebSocket provider
│   │   ├── ThemeProvider.tsx         # Theme context
│   │   ├── GlobalApiEndpoints.tsx    # API dropdown
│   │   ├── ClientBootstrap.tsx       # Client init
│   │   └── RangeSlider.tsx           # Range input
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── store.ts                  # Zustand state
│   │   ├── historyStore.ts           # History state
│   │   ├── sqlHistory.ts             # SQLite operations
│   │   ├── historySqliteWasm.ts      # WASM SQLite
│   │   ├── apiHelpers.ts             # API utilities
│   │   ├── utils.ts                  # Helper functions
│   │   ├── visualConfig.ts           # Visual settings
│   │   ├── fonts.ts                  # Font definitions
│   │   ├── export.ts                 # Export utilities
│   │   ├── pruneScheduler.ts         # Data pruning
│   │   └── adapters/                 # Data adapters
│   │
│   ├── data/                         # Static data
│   │   ├── locations.ts              # Location helpers
│   │   ├── regions.sample.ts         # Sample regions
│   │   └── regions.sample.geojson    # GeoJSON sample
│   │
│   └── types/                        # TypeScript types
│       ├── geojson.d.ts              # GeoJSON types
│       ├── sqljs.d.ts                # sql.js types
│       ├── better-sqlite3.d.ts       # SQLite types
│       └── earcut.d.ts               # Earcut types
│
├── data/                             # Application data
│   ├── exchanges.json                # Exchange locations
│   ├── exchanges.sample.json         # Sample exchanges
│   ├── provider-regions.json         # Region data
│   ├── provider-regions.sample.json  # Sample regions
│   ├── history.json                  # JSON history
│   └── history.sqlite                # SQLite database
│
├── scripts/                          # Utility scripts
│   ├── import-data.js                # Data importer
│   ├── import-regions.js             # Region importer
│   ├── import-locations-direct.js    # Direct import
│   ├── seed-history.js               # Generate history
│   ├── mock-server.js                # Mock WebSocket
│   ├── worker-direct.js              # Probe worker
│   ├── schedule-probes.js            # Probe scheduler
│   ├── compute-rollups.js            # Data aggregation
│   ├── prune-worker.js               # Data pruning
│   ├── refresh-history-db.js         # DB reset
│   ├── history-smoke-test.js         # Quick test
│   ├── run-pairwise-probes.js        # Pairwise probes
│   ├── fetch-live-latency.js         # Live fetcher
│   ├── repair-sqlite.js              # DB repair
│   └── check-r3f-dom.js              # R3F checker
│
├── tests/                            # Test files
│   ├── playwright.smoke.spec.ts      # E2E smoke test
│   ├── history.api.test.js           # History tests
│   ├── history.aggregate.test.js     # Aggregation tests
│   ├── regions.api.test.js           # Region tests
│   ├── probes.run.auth.test.js       # Auth tests
│   ├── probes.trigger.test.js        # Trigger tests
│   ├── realtime.backoff.test.js      # WebSocket tests
│   ├── controls.api.test.js          # Control tests
│   ├── perf.arcs.test.js             # Performance tests
│   └── sqljs.init.test.js            # SQLite tests
│
├── public/                           # Static assets
│   ├── globe.svg                     # Globe icon
│   ├── next.svg                      # Next.js logo
│   ├── vercel.svg                    # Vercel logo
│   ├── file.svg                      # File icon
│   └── window.svg                    # Window icon
│
├── .github/                          # GitHub config
│   └── workflows/                    # CI/CD workflows
│       └── ci.yml                    # GitHub Actions
│
├── playwright.config.ts              # Playwright config
├── jest.config.cjs                   # Jest config
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config
├── eslint.config.mjs                 # ESLint config
├── postcss.config.mjs                # PostCSS config
├── tailwind.config.ts                # Tailwind config (if exists)
├── package.json                      # Dependencies
├── package-lock.json                 # Lock file
├── .env.local                        # Local environment
├── .gitignore                        # Git ignore
├── README.md                         # This file
└── LICENSE                           # MIT License
```

### Key Directories Explained

#### `/src/app/`
Next.js 13+ app directory with file-based routing. Contains all pages and API routes.

#### `/src/component/`
React components for UI and 3D visualization. All components use TypeScript and modern React patterns.

#### `/src/lib/`
Utility functions, state management, and helper libraries. Core business logic resides here.

#### `/data/`
Application data files (exchanges, regions, history). Can be JSON or SQLite format.

#### `/scripts/`
Node.js scripts for data management, testing, and automation. Run with `node scripts/<script>.js`.

#### `/tests/`
Unit tests (Jest) and E2E tests (Playwright). Run with `npm test` or `npm run test:e2e`.

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/TOPLOGY-VISUALIZER.git
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**
5. **Test your changes**
   ```bash
   npm test
   npm run test:e2e
   ```
6. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request**

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Style

- Use TypeScript for all new files
- Follow existing code patterns
- Add comments for complex logic
- Keep components small and focused
- Write tests for new features

### Testing Requirements

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows
- All tests must pass before merging

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Shubham Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Three.js Community** - Powerful 3D library
- **React Three Fiber** - React renderer for Three.js
- **Chart.js** - Beautiful charts
- **Zustand** - Simple state management
- **Vercel** - Hosting platform
- **All Contributors** - Thank you!

---

## 📧 Contact

**Shubham Kumar**
- GitHub: [@shubhamkumar77097](https://github.com/shubhamkumar77097)
- Repository: [TOPLOGY-VISUALIZER](https://github.com/shubhamkumar77097/TOPLOGY-VISUALIZER)

---

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: This README
- **Issue Tracker**: [GitHub Issues](https://github.com/shubhamkumar77097/TOPLOGY-VISUALIZER/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shubhamkumar77097/TOPLOGY-VISUALIZER/discussions)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ by Shubham Kumar**

[⬆ Back to Top](#-latency-topology-visualizer)

</div>
