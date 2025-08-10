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
    return config
  },
}

export default nextConfig