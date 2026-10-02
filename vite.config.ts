import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "node:path";

export default defineConfig({
  base: process.env.FIGMA_PUBLIC_URL
    ? `${process.env.FIGMA_PUBLIC_URL}/`
    : "/",

  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
  ],

  resolve: {
    conditions: ["style"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    sourcemap: false,
    minify: true,
  },

});
