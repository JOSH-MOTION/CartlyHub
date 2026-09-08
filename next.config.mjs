/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'firebasestorage.googleapis.com'],
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