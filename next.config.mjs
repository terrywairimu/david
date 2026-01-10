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
      // Avoid pulling in Node canvas on client
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        canvas: false,
      }
      // Some packages hard-require('canvas'); tell webpack this module doesn't exist in the browser
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        canvas: false,
      }
    }
    // Ignore optional 'canvas' dependency entirely so webpack does not try to resolve it
    config.plugins = config.plugins || []
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^canvas$/ }))

    // Fix CSS extraction issues in Next.js 15
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

export default nextConfig