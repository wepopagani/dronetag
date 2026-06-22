import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AppShell } from '@/components/layout/AppShell';
import { AuthRoutePrefetch } from '@/components/auth/AuthRoutePrefetch';
import { ServiceWorkerCleanup } from '@/components/system/ServiceWorkerCleanup';
import './globals.css';

/** Bump when replacing brand assets so browsers skip stale caches. */
const BRAND_ASSET_VERSION = '3';

export const metadata: Metadata = {
  title: 'DroneTag — Drone Identification Platform',
  description:
    'Digital identification and document management for drone operators. Not an official aviation authority registry.',
  applicationName: 'DroneTag',
  icons: {
    icon: [
      {
        url: `/favicon.png?v=${BRAND_ASSET_VERSION}`,
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: `/icon-192.png?v=${BRAND_ASSET_VERSION}`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: `/icon-512.png?v=${BRAND_ASSET_VERSION}`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: `/apple-touch-icon.png?v=${BRAND_ASSET_VERSION}`,
  },
};

export const viewport: Viewport = {
  themeColor: '#050f24',
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
        <ServiceWorkerCleanup />
        <AuthProvider>
          <LanguageProvider>
            <AuthRoutePrefetch />
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
