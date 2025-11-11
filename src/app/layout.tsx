import type { Metadata } from "next";
import { Geist, Geist_Mono } from '@/lib/fonts';
import "./globals.css";
// server-side prune scheduler (runs when layout module is imported in node)
import '@/lib/pruneScheduler';
import ClientBootstrap from '@/component/ClientBootstrap';
import { ThemeProvider } from '@/component/ThemeProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Latency Topology Visualizer",
  description: "Real-time cryptocurrency exchange latency visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {/* Server-rendered fallback legend so it's always visible */}
          <div className="fixed bottom-4 left-4 z-50 rounded-lg p-3 hidden sm:block" style={{ backgroundColor: 'var(--legend-bg)', color: 'var(--legend-fg)' }}>
            <h3 className="mb-1 text-sm font-semibold">Cloud Providers</h3>
            <ul className="text-xs">
              <li className="flex items-center"><span className="inline-block h-2 w-2 mr-2 rounded-full" style={{backgroundColor: '#FF9900'}}></span>AWS</li>
              <li className="flex items-center"><span className="inline-block h-2 w-2 mr-2 rounded-full" style={{backgroundColor: '#4285F4'}}></span>GCP</li>
              <li className="flex items-center"><span className="inline-block h-2 w-2 mr-2 rounded-full" style={{backgroundColor: '#0078D4'}}></span>Azure</li>
              <li className="flex items-center"><span className="inline-block h-2 w-2 mr-2 rounded-full" style={{backgroundColor: '#9E9E9E'}}></span>Other</li>
            </ul>
          </div>

          {children}
          <ClientBootstrap />
        </ThemeProvider>
      </body>
    </html>
  );
}
