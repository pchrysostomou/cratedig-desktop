import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Tauri (Phase 6) expects a fixed dev port and an untouched console output.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
