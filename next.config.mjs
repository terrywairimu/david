import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@pdfme/generator', '@pdfme/schemas', '@pdfme/common'],
    webpackBuildWorker: false,
  },
  turbopack: {},
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        canvas: false,
      }
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        canvas: false,
      }
    }
    config.plugins = config.plugins || []
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^canvas$/ }))

    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            styles: {
              name: 'styles',
              test: /\.(css|scss)$/,
              chunks: 'all',
              enforce: true,
            },
            pdfme: {
              name: 'pdfme',
              test: /[\\/]node_modules[\\/]@pdfme[\\/]/,
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
          },
        },
      }
    }

    return config
  },
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  reloadOnOnline: false,
});

export default withSerwist(nextConfig)
