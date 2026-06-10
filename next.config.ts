import type {NextConfig} from 'next';

// ─── Security headers ────────────────────────────────────────────────────
// Defense-in-depth headers applied to every response. These mitigate:
//   - XSS (Content-Security-Policy)
//   - Clickjacking (X-Frame-Options + frame-ancestors)
//   - MIME-type sniffing (X-Content-Type-Options)
//   - Information leakage via referrer (Referrer-Policy)
//   - Browser-feature abuse (Permissions-Policy)
//   - Downgrade attacks / SSL stripping (Strict-Transport-Security)
//
// CSP is intentionally NOT super-strict for now: 'unsafe-inline' on scripts
// is required by Next.js's inline bootstrap script in dev. In production
// you can tighten this to nonce-based once you measure no app breakage.
// connect-src includes Supabase + cdnjs (PDF.js worker) + Google Fonts.
const SUPABASE_HOST = 'https://ilbpzbapspfwkvkbzfkk.supabase.co';
// AI backend origin (e.g. http://localhost:4000 in dev, your deployed URL in
// prod). Whitelisted in connect-src so the browser allows fetch() to it.
const AI_BACKEND = process.env.NEXT_PUBLIC_AI_BACKEND_URL ?? '';
// Cashfree checkout SDK (loaded from sdk.cashfree.com) plus the payment + API
// hosts it talks to and frames during checkout. Both production and sandbox
// hosts are listed so either CASHFREE_ENV works without another config change.
const CASHFREE_HOSTS =
  'https://sdk.cashfree.com https://payments.cashfree.com https://payments-test.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com';

const ContentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' needed by Next.js runtime; 'unsafe-eval' by pdfjs.
  // `blob:` needed by pdfjs which spins up its parser Web Worker from a
  // dynamically-generated blob URL (script.workerSrc → fetch → Blob → URL.createObjectURL).
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdnjs.cloudflare.com https://accounts.google.com ${CASHFREE_HOSTS}`,
  // Explicit worker-src — modern browsers prefer this over script-src for workers.
  `worker-src 'self' blob:`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: https: ${SUPABASE_HOST}`,
  `media-src 'self' blob: ${SUPABASE_HOST}`,
  // `data:` in connect-src so pdfjs can fetch PDFs served as base64 data
  // URLs (Agreements stores its uploaded PDF as a data URL in client state).
  `connect-src 'self' data: blob: ${SUPABASE_HOST} ${AI_BACKEND} wss://*.supabase.co https://cdnjs.cloudflare.com https://accounts.google.com ${CASHFREE_HOSTS}`,
  // `blob:` so the content-library PDF preview can render the fetched
  // PDF in an <iframe src=blob:…>. Without it the iframe is blocked and
  // shows the browser's broken-file icon.
  `frame-src 'self' blob: https://accounts.google.com ${CASHFREE_HOSTS}`,
  `frame-ancestors 'none'`, // disallow embedding the app in any iframe
  // Cashfree's checkout SDK POSTs a form to its own hosted payment page.
  `form-action 'self' ${CASHFREE_HOSTS}`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  // Force HTTPS for the next 2 years; include subdomains; eligible for HSTS preload list
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Belt-and-braces clickjacking protection (older browsers ignore CSP frame-ancestors)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers from MIME-sniffing responses away from the declared Content-Type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limit how much referrer info leaks to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable powerful browser features the app doesn't use, by default
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self "https://sdk.cashfree.com" "https://payments.cashfree.com" "https://payments-test.cashfree.com"), usb=()',
  },
  // Prevent Adobe Flash / PDF reader from loading cross-domain (legacy but cheap)
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  // Opt-in to cross-origin isolation defaults
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // (Earlier transpilePackages + webpack tweaks for react-pdf removed —
  // we no longer import react-pdf anywhere. PDF rendering now loads
  // pdfjs 3.11.174 UMD from CDN at runtime via src/components/pdf-shim.tsx
  // and src/components/PdfViewer.tsx, which bypasses Webpack completely.)
  // Apply security headers to every route
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      // ✅ Supabase storage — allows cover images and logos to load
      {
        protocol: 'https',
        hostname: 'ilbpzbapspfwkvkbzfkk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;