import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_URL = "http://localhost:4000";

export default defineConfig({
  plugins: [
    // Must come before the React plugin.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    // Same-origin in dev so Better Auth cookies just work.
    proxy: {
      "/api": { target: API_URL, changeOrigin: true },
    },
  },
});
