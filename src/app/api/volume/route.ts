import { NextResponse } from 'next/server';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/exchanges/binance/tickers';

export async function GET() {
  const apiKey = process.env.COINGECKO_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'CoinGecko API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${COINGECKO_API_URL}?api_key=${apiKey}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('CoinGecko API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch data from CoinGecko', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    
    // We only need a subset of the data for the visualization
    const simplifiedData = data.tickers.map((ticker: any) => ({
      base: ticker.base,
      target: ticker.target,
      volume: ticker.converted_volume.usd,
    }));

    return NextResponse.json(simplifiedData);
  } catch (error) {
    console.error('Error fetching from CoinGecko API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
