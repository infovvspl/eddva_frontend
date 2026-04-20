import { defineConfig, loadEnv, createLogger, type Logger } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** Omit Vite's default "[vite] http proxy error … ECONNREFUSED" spam when the API is down. */
function createQuietProxyLogger(): Logger {
  const base = createLogger();
  const drop = (msg: unknown) => {
    const s = typeof msg === "string" ? msg : String(msg ?? "");
    return (
      (s.includes("http proxy error") || s.includes("ws proxy error") || s.includes("ws proxy socket error")) &&
      (s.includes("ECONNREFUSED") || s.includes("ETIMEDOUT") || s.includes("ENOTFOUND"))
    );
  };
  return {
    ...base,
    error: (msg, options) => {
      if (drop(msg)) return;
      base.error(msg, options);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim() || "http://127.0.0.1:3000";

  return {
  customLogger: mode === "development" ? createQuietProxyLogger() : undefined,
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Allow subdomain access like soa.localhost:8080
    allowedHosts: "all",
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      // Socket.IO (namespaces /live, /battle, …) so dev works on localhost or LAN IP
      "/socket.io": {
        target: proxyTarget,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["agora-rtc-sdk-ng"],
  },
};
});
