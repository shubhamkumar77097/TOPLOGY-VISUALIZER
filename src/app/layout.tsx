import type { Metadata } from "next";
import { Geist, Geist_Mono } from '@/lib/fonts';
import "./globals.css";
// server-side prune scheduler (runs when layout module is imported in node)
import '@/lib/pruneScheduler';
import ClientBootstrap from '@/component/ClientBootstrap';
import { ThemeProvider } from '@/component/ThemeProvider';
import { GlobalApiEndpoints } from '@/component/GlobalApiEndpoints';

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('tv-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <ClientBootstrap />
          <GlobalApiEndpoints />
        </ThemeProvider>
      </body>
    </html>
  );
}
