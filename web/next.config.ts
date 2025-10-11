import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ffmpeg-static", "fluent-ffmpeg", "@ffprobe-installer/ffprobe"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
