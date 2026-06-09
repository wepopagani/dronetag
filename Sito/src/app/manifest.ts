import type { MetadataRoute } from 'next';

/**
 * PWA web manifest (Next.js 16 file-convention API).
 *
 * Served at `/manifest.webmanifest` and referenced automatically from
 * the root layout. The icons resolve from `public/`. The start URL points
 * at the public landing page so freshly installed home-screen icons open
 * directly into the marketing/login page rather than into a 404.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'DroneTag',
    short_name: 'DroneTag',
    description:
      'Identificazione digitale e gestione documentale per operatori di droni. Non sostituisce i registri ufficiali ENAC.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#050f24',
    background_color: '#050f24',
    lang: 'it',
    categories: ['utilities', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
