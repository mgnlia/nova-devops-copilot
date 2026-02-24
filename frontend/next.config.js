/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explicitly use src/ as the source directory.
  // This resolves the ambiguity between root /app and /src/app.
  experimental: {
    // srcDir is not a Next.js option — we handle it via the file structure.
    // The real fix: tsconfig paths @/* → ./src/* and only src/app/ exists.
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

module.exports = nextConfig;
