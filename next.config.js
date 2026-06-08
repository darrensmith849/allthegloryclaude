/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    // Allow per-<Image/> quality overrides. Required from Next.js 16 onwards
    // when a component passes a non-default value via the `quality` prop.
    // 75 is the default; 90 + 100 are used by the sticky backdrop layers.
    qualities: [75, 90, 100],
  },
  async redirects() {
    // Donation flow was retired. Bounce every old donate-adjacent URL to
    // /contact (the closest "stay involved" surface) so anyone who has the
    // links bookmarked doesn't hit a 404. Permanent so search engines
    // forget the old URLs.
    return [
      { source: '/donate', destination: '/contact', permanent: true },
      { source: '/give', destination: '/contact', permanent: true },
      { source: '/sow', destination: '/contact', permanent: true },
      // /success and /cancel were Stripe return URLs — point them at home
      // since they have no successor.
      { source: '/success', destination: '/', permanent: true },
      { source: '/cancel', destination: '/', permanent: true },
      // The commissioned-work page used to live at /events. Permanent so any
      // crawled link or bookmark lands on the canonical URL.
      { source: '/events', destination: '/commissions', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/audio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
