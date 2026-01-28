import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 支持流式响应和 Prisma/LangGraph 在 Vercel 部署
  serverExternalPackages: [
    "@langchain/core",
    "@langchain/langgraph",
    "@langchain/openai",
    "@langchain/community",
    "@langchain/google-genai",
    "@langchain/mcp-adapters",
    "@prisma/client",
    "pg",
  ],

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
