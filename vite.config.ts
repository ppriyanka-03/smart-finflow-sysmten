import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Allow external access
    port: 5173, // Safe default port (Vite's default)
    strictPort: false, // Allow fallback to free port if busy
    open: true, // Auto-open browser
    hmr: {
      overlay: false, // Disable error overlay for cleaner UI
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
