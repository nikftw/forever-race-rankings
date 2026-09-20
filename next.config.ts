import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "1";
const repoName = "forever-race-rankings";

const nextConfig: NextConfig = {
  ...(isPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath: `/${repoName}`,
        images: { unoptimized: true },
      }
    : {}),
  env: {
    NEXT_PUBLIC_CAN_RESIM: isPages ? "0" : "1",
    NEXT_PUBLIC_GITHUB_REPO: "https://github.com/nikftw/forever-race-rankings",
  },
};

export default nextConfig;
