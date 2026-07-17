/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // Cloudflare Workers has no built-in image optimization service (that's a
    // Vercel feature), so serve images as-is. The album art, lyric cards and
    // photos are already sized appropriately at source.
    unoptimized: true,
  },
  async redirects() {
    // The giving page lives at /give so the URL matches the "Give" nav label.
    // It was previously served at /donate, so that (and the other
    // donate-adjacent aliases) now redirect forward to /give — bookmarked and
    // shared links, plus any in-flight Paystack callback, still land right.
    return [
      { source: '/donate', destination: '/give', permanent: true },
      { source: '/donate/success', destination: '/give/success', permanent: true },
      { source: '/sow', destination: '/give', permanent: true },
      // /success and /cancel were the old Stripe return URLs — point them at
      // home since they have no successor (the new flow uses /give/success).
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
