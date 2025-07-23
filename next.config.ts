import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    devIndicators: false,
    // Production optimization - standalone output
    output: "standalone",
    // Image optimization
    images: {
        unoptimized: false,
        remotePatterns: [],
    },
    // Webpack optimization
    webpack: (config, { isServer }) => {
        // Production optimizations
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }
        return config;
    },
};

export default nextConfig;
