/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'firebasestorage.googleapis.com'],
  },
  async redirects() {
    // Send the old Vercel address to the real domain so Google indexes cartlyhubgh.com.
    // /api is excluded so crons and webhooks hitting the vercel.app host keep working.
    return [
      {
        source: '/:path((?!api/).*)',
        has: [{ type: 'host', value: 'cartly-hub.vercel.app' }],
        destination: 'https://cartlyhubgh.com/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://studio-572308010-90c24.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;