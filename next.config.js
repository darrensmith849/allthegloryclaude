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
    // /donate is a live donation page again (gifts go to CrossCoders, a
    // venture of the Kingdom Come Foundation). Keep the old donate-adjacent
    // aliases pointing at it so bookmarked links land in the right place.
    return [
      // Canonicalise the bare apex to www. (matches how the site behaved on
      // Vercel). Without this, alltheglory.co.za and www.alltheglory.co.za are
      // two separate origins — and the private dashboard's localStorage lives
      // under www, so visiting the apex looked like the data had reset.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'alltheglory.co.za' }],
        destination: 'https://www.alltheglory.co.za/:path*',
        permanent: true,
      },
      { source: '/give', destination: '/donate', permanent: true },
      { source: '/sow', destination: '/donate', permanent: true },
      // /success and /cancel were the old Stripe return URLs — point them at
      // home since they have no successor (the new flow uses /donate/success).
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
