/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendServer = process.env.NEXT_PUBLIC_IMAGE_SERVER || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendServer}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendServer}/uploads/:path*`,
      }
    ];
  }
};

export default nextConfig;
