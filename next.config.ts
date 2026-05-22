import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubActions ? "/smetafix-landing" : "",
  assetPrefix: isGithubActions ? "/smetafix-landing/" : undefined,
};

export default nextConfig;
