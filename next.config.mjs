/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // In production set ALLOWED_ORIGIN to your deployed domain, e.g. https://your-app.vercel.app
    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          // X-API-Key for write endpoints; X-Admin-Secret for admin/migrate routes
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, X-API-Key, X-Admin-Secret' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
