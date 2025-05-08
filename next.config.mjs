/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
        pathname: "/**",
      },
    ],
  },
  // Add output option for standalone production builds
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  // Optimization settings
  reactStrictMode: true,
  // Cross-origin configuration
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? "https://autoxpulse.live"
                : "http://localhost:3000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
