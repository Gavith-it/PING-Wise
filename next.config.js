/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Ignore ESLint warnings during build (Vercel might treat them as errors)
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint warnings during builds
  },
  
  // Ignore TypeScript errors during build (if any)
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checking enabled
  },
  
  // Security headers and cache headers
  async headers() {
    return [
      {
        // Cache static assets (JavaScript bundles, CSS, images) for 1 year
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache other static files
        source: '/:path*\\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  },

  // Optimize images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features for better performance
  // experimental: {
  //   optimizeCss: true, // Disabled due to critters dependency issue
  // },
};

module.exports = nextConfig;

