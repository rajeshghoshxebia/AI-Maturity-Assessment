/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
  webpack(config, { webpack }) {
    // pptxgenjs and other packages use "node:" URI scheme — strip the prefix
    // so webpack can resolve them using the browser fallbacks below.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      zlib: false,
      assert: false,
      http: false,
      https: false,
      url: false,
    };
    return config;
  },
};

export default nextConfig;
