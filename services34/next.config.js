/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Mission photos are uploaded to Cloudinary (same account as jobber.city).
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
};

module.exports = nextConfig;
