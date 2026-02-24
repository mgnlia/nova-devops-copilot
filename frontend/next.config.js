/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use src/ directory — Next.js will resolve app router from src/app/
  // and ignore the stale root-level app/ folder.
  // NEXT_PUBLIC_API_URL must be set in Vercel environment variables.
};

module.exports = nextConfig;
