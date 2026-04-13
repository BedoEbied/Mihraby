import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    qualities: [70, 75, 90],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Enable HSTS only in production to avoid breaking local HTTP dev.
          ...(isProd
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
          // CSP is intentionally report-only for now to avoid breaking Next.js runtime
          // without a nonce-based implementation.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "img-src 'self' data: blob:",
              "style-src 'self' 'unsafe-inline'",
              // Next.js uses inline scripts; a strict nonce-based CSP will be added later.
              "script-src 'self' 'unsafe-inline'",
              "connect-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
