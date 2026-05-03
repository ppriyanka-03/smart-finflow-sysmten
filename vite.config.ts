import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
