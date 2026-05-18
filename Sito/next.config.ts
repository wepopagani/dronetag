import type { NextConfig } from 'next';

// PR-SEC-2 V-036: production builds MUST have valid Firebase env vars.
// Without them, DEMO_MODE silently activates at runtime and treats every
// signed-in user as admin (see src/contexts/AuthContext.tsx). Fail the
// build instead of shipping a vulnerable bundle.
if (process.env.NODE_ENV === 'production') {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[next.config] Production build refused: missing required env vars: ${missing.join(', ')}.\n` +
      'Set every NEXT_PUBLIC_FIREBASE_* var before building. See .env.local.example.',
    );
  }
}

// ─── PR-SEC-3: Security headers + Content-Security-Policy ───────────────────
//
// Closes V-022 / V-023.
//
// CSP is shipped in REPORT-ONLY mode by default so we can observe what
// breaks in the wild before flipping to enforce. Set `CSP_ENFORCE=true`
// in the build environment to switch the header name from
// `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.
//
// The directives below are intentionally tight on `frame-ancestors`,
// `base-uri`, `form-action` and `worker-src`, but allow `'unsafe-inline'`
// on `script-src` and `style-src` because:
//   • Next.js + Tailwind currently inject inline `<script>` and `<style>`
//     tags during hydration. Switching to nonces requires running every
//     request through proxy.ts, which in turn requires Edge runtime —
//     incompatible with our firebase-admin verification today.
//   • A follow-up PR can introduce nonces once the proxy is split into
//     an edge-shim + a Node.js verifier. Tracked as a future hardening.
//
// Trusted external hosts are kept to the strict minimum: Firebase
// (Auth/Firestore/Storage/AppCheck/Functions), reCAPTCHA, the Google
// fonts/static origins used by Firebase auth UIs.

const FIREBASE_API_HOSTS = [
  'https://*.googleapis.com',
  'https://*.firebaseio.com',
  'wss://*.firebaseio.com',
  'https://*.cloudfunctions.net',
  'https://*.run.app',
  'https://firebaseinstallations.googleapis.com',
  'https://content-firebaseappcheck.googleapis.com',
];

const RECAPTCHA_HOSTS = [
  'https://www.google.com',
  'https://www.recaptcha.net',
  'https://recaptcha.net',
  'https://www.gstatic.com',
];

function envCsv(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const TRUSTED_PDF_HOSTS = [
  'https://firebasestorage.googleapis.com',
  'https://storage.googleapis.com',
  ...envCsv('NEXT_PUBLIC_TRUSTED_PDF_HOSTS').map((h) => `https://${h}`),
];

const csp = [
  // Default deny everything we don't explicitly allow.
  `default-src 'self'`,

  // Scripts: app bundle + Firebase SDK + reCAPTCHA. 'unsafe-inline'
  // covers Next's inline hydration scripts; see comment above for
  // the planned nonce migration.
  [
    `script-src`,
    `'self'`,
    `'unsafe-inline'`,
    'https://apis.google.com',
    ...RECAPTCHA_HOSTS,
  ].join(' '),

  // Inline styles are emitted by Tailwind / Next runtime. Keeping
  // 'unsafe-inline' here is the standard trade-off for App Router.
  `style-src 'self' 'unsafe-inline'`,

  // Images: same-origin, inline data URIs, Firebase Storage tokens,
  // and any extra trusted hosts the operator configures.
  [
    `img-src`,
    `'self'`,
    'data:',
    'blob:',
    ...TRUSTED_PDF_HOSTS,
  ].join(' '),

  // Fonts: self only (Tailwind ships system fonts; no Google Fonts).
  `font-src 'self' data:`,

  // Network: Firestore (https + websocket), Auth, Functions, App Check,
  // and the Storage upload endpoints. Same-origin covers /api/session.
  [
    `connect-src`,
    `'self'`,
    ...FIREBASE_API_HOSTS,
    ...RECAPTCHA_HOSTS,
  ].join(' '),

  // Iframes (PDF previews + reCAPTCHA challenge frame). Restricted to
  // Firebase Storage (where uploaded PDFs live) and reCAPTCHA hosts.
  [
    `frame-src`,
    `'self'`,
    ...TRUSTED_PDF_HOSTS,
    ...RECAPTCHA_HOSTS,
  ].join(' '),

  // Service worker registered by src/components/pwa/PWAClient.tsx.
  `worker-src 'self'`,

  // PWA manifest.
  `manifest-src 'self'`,

  // Form submissions (login, signup, account forms).
  `form-action 'self'`,

  // Anti-clickjacking — supersedes X-Frame-Options for modern browsers.
  `frame-ancestors 'none'`,

  // Base tag must be self-only so an attacker can't flip relative URLs.
  `base-uri 'self'`,

  // Force https for any sub-resource that uses http://.
  `upgrade-insecure-requests`,
].join('; ');

const CSP_HEADER_NAME = process.env.CSP_ENFORCE === 'true'
  ? 'Content-Security-Policy'
  : 'Content-Security-Policy-Report-Only';

const securityHeaders: { key: string; value: string }[] = [
  { key: CSP_HEADER_NAME, value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // geolocation: self only (used by the Report-found-drone form).
    // camera, microphone, payment, USB: explicitly denied.
    // interest-cohort: opt out of FLoC/Topics.
    value: [
      'geolocation=(self)',
      'camera=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()',
    ].join(', '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // PR-SEC-3 V-020: configure remotePatterns so the optimised image
  // pipeline (next/image) accepts Firebase Storage URLs out of the
  // box. Currently we render legacy public-profile images via raw
  // <img> with referrerPolicy="no-referrer" because /u/[slug] uses
  // dronesPublic; this future-proofs upcoming next/image migrations.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      ...envCsv('NEXT_PUBLIC_TRUSTED_PDF_HOSTS').map((hostname) => ({
        protocol: 'https' as const,
        hostname,
      })),
    ],
  },
};

export default nextConfig;
