/** @type {import('next').NextConfig} */
const repositoryName = "campus-timetable-intelligence";
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";
const basePath = isGitHubPagesBuild ? `/${repositoryName}` : "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

export default nextConfig;
