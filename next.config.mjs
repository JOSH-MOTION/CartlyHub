/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'firebasestorage.googleapis.com'],
  },
  // firebase-admin/auth pulls in jwks-rsa -> jose (ESM-only), which webpack's
  // bundling of serverless functions can't require() — ERR_REQUIRE_ESM in
  // production even though it builds fine locally. Excluding firebase-admin
  // from bundling lets Node resolve it natively at runtime instead.
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
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