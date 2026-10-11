import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "app",
  publicDir: "../public",
  plugins: [react(), tailwindcss()],
  base: "/gym/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
