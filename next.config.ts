import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = "campaign-gazetteer";
const basePath = isGitHubPages ? `/${repositoryName}` : "";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath,
      assetPrefix: basePath,
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
      typescript: {
        tsconfigPath: "./tsconfig.pages.json",
      },
    }
  : {};

export default nextConfig;
