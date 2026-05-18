import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';
import { PWAClient } from '@/components/pwa/PWAClient';
import './globals.css';

export const metadata: Metadata = {
  title: 'DroneTag — Drone Identification Platform',
  description:
    'Digital identification and document management for drone operators. Not an official aviation authority registry.',
  applicationName: 'DroneTag',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'DroneTag',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <LanguageProvider>
            <Navbar />
            <main className="min-h-screen pt-16">{children}</main>
            <PWAClient />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
