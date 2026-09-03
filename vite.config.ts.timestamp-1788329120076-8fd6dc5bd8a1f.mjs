// vite.config.ts
import { defineConfig, loadEnv, createLogger } from "file:///D:/edtech/eddva_frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/edtech/eddva_frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/edtech/eddva_frontend/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\edtech\\eddva_frontend";
function createQuietProxyLogger() {
  const base = createLogger();
  const drop = (msg) => {
    const s = typeof msg === "string" ? msg : String(msg ?? "");
    return (s.includes("http proxy error") || s.includes("ws proxy error") || s.includes("ws proxy socket error")) && (s.includes("ECONNREFUSED") || s.includes("ETIMEDOUT") || s.includes("ENOTFOUND") || s.includes("ECONNRESET") || s.includes("ECONNABORTED"));
  };
  return {
    ...base,
    error: (msg, options) => {
      if (drop(msg)) return;
      base.error(msg, options);
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim() || "http://localhost:3000";
  return {
    customLogger: mode === "development" ? createQuietProxyLogger() : void 0,
    build: {
      // Target iOS Safari 14+ and equivalent — prevents SWC outputting syntax
      // that older iOS WebKit cannot parse (private class fields, etc.)
      target: ["es2019", "safari14", "chrome87", "firefox78"]
    },
    server: {
      host: "0.0.0.0",
      port: 8080,
      hmr: {
        overlay: false
      },
      // Allow subdomain access like soa.localhost:8080
      allowedHosts: "all",
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        },
        // Socket.IO (namespaces /live, /battle, …) so dev works on localhost or LAN IP
        "/socket.io": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          secure: false
        }
      }
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    optimizeDeps: {
      include: ["agora-rtc-sdk-ng"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxlZHRlY2hcXFxcZWRkdmFfZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGVkdGVjaFxcXFxlZGR2YV9mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovZWR0ZWNoL2VkZHZhX2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52LCBjcmVhdGVMb2dnZXIsIHR5cGUgTG9nZ2VyIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vKiogT21pdCBWaXRlJ3MgZGVmYXVsdCBcIlt2aXRlXSBodHRwIHByb3h5IGVycm9yIFx1MjAyNiBFQ09OTlJFRlVTRURcIiBzcGFtIHdoZW4gdGhlIEFQSSBpcyBkb3duLiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVRdWlldFByb3h5TG9nZ2VyKCk6IExvZ2dlciB7XHJcbiAgY29uc3QgYmFzZSA9IGNyZWF0ZUxvZ2dlcigpO1xyXG4gIGNvbnN0IGRyb3AgPSAobXNnOiB1bmtub3duKSA9PiB7XHJcbiAgICBjb25zdCBzID0gdHlwZW9mIG1zZyA9PT0gXCJzdHJpbmdcIiA/IG1zZyA6IFN0cmluZyhtc2cgPz8gXCJcIik7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAocy5pbmNsdWRlcyhcImh0dHAgcHJveHkgZXJyb3JcIikgfHwgcy5pbmNsdWRlcyhcIndzIHByb3h5IGVycm9yXCIpIHx8IHMuaW5jbHVkZXMoXCJ3cyBwcm94eSBzb2NrZXQgZXJyb3JcIikpICYmXHJcbiAgICAgIChzLmluY2x1ZGVzKFwiRUNPTk5SRUZVU0VEXCIpIHx8IHMuaW5jbHVkZXMoXCJFVElNRURPVVRcIikgfHwgcy5pbmNsdWRlcyhcIkVOT1RGT1VORFwiKSB8fCBzLmluY2x1ZGVzKFwiRUNPTk5SRVNFVFwiKSB8fCBzLmluY2x1ZGVzKFwiRUNPTk5BQk9SVEVEXCIpKVxyXG4gICAgKTtcclxuICB9O1xyXG4gIHJldHVybiB7XHJcbiAgICAuLi5iYXNlLFxyXG4gICAgZXJyb3I6IChtc2csIG9wdGlvbnMpID0+IHtcclxuICAgICAgaWYgKGRyb3AobXNnKSkgcmV0dXJuO1xyXG4gICAgICBiYXNlLmVycm9yKG1zZywgb3B0aW9ucyk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpO1xyXG4gIC8vIFVzZSBsb2NhbGhvc3QgKG5vdCAxMjcuMC4wLjEpIHNvIGNoYW5nZU9yaWdpbiBkb2VzIG5vdCBtYWtlIHRoZSBBUEkgdHJlYXQgXCIxMjdcIiBhcyBhIHRlbmFudCBzdWJkb21haW5cclxuICBjb25zdCBwcm94eVRhcmdldCA9IGVudi5WSVRFX0RFVl9QUk9YWV9UQVJHRVQ/LnRyaW0oKSB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICByZXR1cm4ge1xyXG4gIGN1c3RvbUxvZ2dlcjogbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiID8gY3JlYXRlUXVpZXRQcm94eUxvZ2dlcigpIDogdW5kZWZpbmVkLFxyXG4gIGJ1aWxkOiB7XHJcbiAgICAvLyBUYXJnZXQgaU9TIFNhZmFyaSAxNCsgYW5kIGVxdWl2YWxlbnQgXHUyMDE0IHByZXZlbnRzIFNXQyBvdXRwdXR0aW5nIHN5bnRheFxyXG4gICAgLy8gdGhhdCBvbGRlciBpT1MgV2ViS2l0IGNhbm5vdCBwYXJzZSAocHJpdmF0ZSBjbGFzcyBmaWVsZHMsIGV0Yy4pXHJcbiAgICB0YXJnZXQ6IFtcImVzMjAxOVwiLCBcInNhZmFyaTE0XCIsIFwiY2hyb21lODdcIiwgXCJmaXJlZm94NzhcIl0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgICAvLyBBbGxvdyBzdWJkb21haW4gYWNjZXNzIGxpa2Ugc29hLmxvY2FsaG9zdDo4MDgwXHJcbiAgICBhbGxvd2VkSG9zdHM6IFwiYWxsXCIsXHJcbiAgICBwcm94eToge1xyXG4gICAgICBcIi9hcGlcIjoge1xyXG4gICAgICAgIHRhcmdldDogcHJveHlUYXJnZXQsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiL3VwbG9hZHNcIjoge1xyXG4gICAgICAgIHRhcmdldDogcHJveHlUYXJnZXQsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFNvY2tldC5JTyAobmFtZXNwYWNlcyAvbGl2ZSwgL2JhdHRsZSwgXHUyMDI2KSBzbyBkZXYgd29ya3Mgb24gbG9jYWxob3N0IG9yIExBTiBJUFxyXG4gICAgICBcIi9zb2NrZXQuaW9cIjoge1xyXG4gICAgICAgIHRhcmdldDogcHJveHlUYXJnZXQsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHdzOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1wiYWdvcmEtcnRjLXNkay1uZ1wiXSxcclxuICB9LFxyXG59O1xyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnUSxTQUFTLGNBQWMsU0FBUyxvQkFBaUM7QUFDalUsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxTQUFTLHlCQUFpQztBQUN4QyxRQUFNLE9BQU8sYUFBYTtBQUMxQixRQUFNLE9BQU8sQ0FBQyxRQUFpQjtBQUM3QixVQUFNLElBQUksT0FBTyxRQUFRLFdBQVcsTUFBTSxPQUFPLE9BQU8sRUFBRTtBQUMxRCxZQUNHLEVBQUUsU0FBUyxrQkFBa0IsS0FBSyxFQUFFLFNBQVMsZ0JBQWdCLEtBQUssRUFBRSxTQUFTLHVCQUF1QixPQUNwRyxFQUFFLFNBQVMsY0FBYyxLQUFLLEVBQUUsU0FBUyxXQUFXLEtBQUssRUFBRSxTQUFTLFdBQVcsS0FBSyxFQUFFLFNBQVMsWUFBWSxLQUFLLEVBQUUsU0FBUyxjQUFjO0FBQUEsRUFFOUk7QUFDQSxTQUFPO0FBQUEsSUFDTCxHQUFHO0FBQUEsSUFDSCxPQUFPLENBQUMsS0FBSyxZQUFZO0FBQ3ZCLFVBQUksS0FBSyxHQUFHLEVBQUc7QUFDZixXQUFLLE1BQU0sS0FBSyxPQUFPO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFM0MsUUFBTSxjQUFjLElBQUksdUJBQXVCLEtBQUssS0FBSztBQUV6RCxTQUFPO0FBQUEsSUFDUCxjQUFjLFNBQVMsZ0JBQWdCLHVCQUF1QixJQUFJO0FBQUEsSUFDbEUsT0FBTztBQUFBO0FBQUE7QUFBQSxNQUdMLFFBQVEsQ0FBQyxVQUFVLFlBQVksWUFBWSxXQUFXO0FBQUEsSUFDeEQ7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILFNBQVM7QUFBQSxNQUNYO0FBQUE7QUFBQSxNQUVBLGNBQWM7QUFBQSxNQUNkLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsUUFDQSxZQUFZO0FBQUEsVUFDVixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBO0FBQUEsUUFFQSxjQUFjO0FBQUEsVUFDWixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxJQUFJO0FBQUEsVUFDSixRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDOUUsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYztBQUFBLE1BQ1osU0FBUyxDQUFDLGtCQUFrQjtBQUFBLElBQzlCO0FBQUEsRUFDRjtBQUNBLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
