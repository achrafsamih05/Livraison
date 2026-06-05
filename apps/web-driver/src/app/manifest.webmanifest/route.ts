import { NextResponse } from 'next/server';

/**
 * PWA manifest served as a route so it can be generated/versioned. Enables
 * installation to the home screen and standalone display on mobile browsers.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      name: 'Livraison Driver',
      short_name: 'Driver',
      description: 'Manage pickups and deliveries on the go.',
      start_url: '/dashboard',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#09090b',
      theme_color: '#0C5CAB',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    { headers: { 'content-type': 'application/manifest+json' } },
  );
}
