import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['items-images-production.s3.us-west-2.amazonaws.com']
  }
};

export default nextConfig;
