import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'docs.google.com',
      },
    ],
  },
  // Ensure env variables get exposed correctly
  env: {
    NEXT_PUBLIC_GOOGLE_SHEETS_CONFIGURED: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'true' : 'false',
    NEXT_PUBLIC_N8N_CONNECTED: process.env.N8N_WEBHOOK_URL ? 'true' : 'false',
    NEXT_PUBLIC_STORAGE_MODE: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'sheets' : 'local',
  }
};

export default nextConfig;
