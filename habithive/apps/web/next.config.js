/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }, // check-in photos (sec 2.3 / 2.8)
    ],
  },
};

module.exports = nextConfig;
