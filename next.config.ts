import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: { "/api/*": ["./knowledge/**/*"] },
};
export default config;
