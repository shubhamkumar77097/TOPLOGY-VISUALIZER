
// Define a type for our location data for TypeScript
export type LocationData = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  provider: "AWS" | "GCP" | "Azure" | "Other";
};

// Define a color map for each provider
export const PROVIDER_COLORS = {
  AWS: "#FF9900", // Orange
  GCP: "#4285F4", // Blue
  Azure: "#0078D4", // Microsoft Blue
  Other: "#9E9E9E", // Gray
};

// Mock data for exchange servers
// Prefer runtime-provided authoritative dataset if available under data/exchanges.json
export const locations: LocationData[] = [
  {
    id: "binance-aws-tokyo",
    name: "Binance",
    city: "Tokyo",
    lat: 35.6895,
    lng: 139.6917,
    provider: "AWS",
  },
  {
    id: "bybit-aws-singapore",
    name: "Bybit",
    city: "Singapore",
    lat: 1.3521,
    lng: 103.8198,
    provider: "AWS",
  },
  {
    id: "deribit-gcp-netherlands",
    name: "Deribit",
    city: "Amsterdam",
    lat: 52.3676,
    lng: 4.9041,
    provider: "GCP",
  },
  {
    id: "okx-azure-hongkong",
    name: "OKX",
    city: "Hong Kong",
    lat: 22.3193,
    lng: 114.1694,
    provider: "Azure",
  },
  {
    id: "coinbase-other-usa",
    name: "Coinbase",
    city: "N. Virginia",
    lat: 38.8339,
    lng: -77.1700,
    provider: "Other",
  },
];