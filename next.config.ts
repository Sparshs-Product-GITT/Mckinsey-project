import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '16mb',
    },
  },
  serverExternalPackages: [],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.cloudflare.com https://us.i.posthog.com https://us-assets.i.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://challenges.cloudflare.com",
              "connect-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://us.i.posthog.com https://us-assets.i.posthog.com",
              "frame-src https://challenges.cloudflare.com https://*.cloudflare.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
