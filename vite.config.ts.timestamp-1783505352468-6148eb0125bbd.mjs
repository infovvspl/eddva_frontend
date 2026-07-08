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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxlZHRlY2hcXFxcZWRkdmFfZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGVkdGVjaFxcXFxlZGR2YV9mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovZWR0ZWNoL2VkZHZhX2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52LCBjcmVhdGVMb2dnZXIsIHR5cGUgTG9nZ2VyIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vKiogT21pdCBWaXRlJ3MgZGVmYXVsdCBcIlt2aXRlXSBodHRwIHByb3h5IGVycm9yIFx1MjAyNiBFQ09OTlJFRlVTRURcIiBzcGFtIHdoZW4gdGhlIEFQSSBpcyBkb3duLiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVRdWlldFByb3h5TG9nZ2VyKCk6IExvZ2dlciB7XHJcbiAgY29uc3QgYmFzZSA9IGNyZWF0ZUxvZ2dlcigpO1xyXG4gIGNvbnN0IGRyb3AgPSAobXNnOiB1bmtub3duKSA9PiB7XHJcbiAgICBjb25zdCBzID0gdHlwZW9mIG1zZyA9PT0gXCJzdHJpbmdcIiA/IG1zZyA6IFN0cmluZyhtc2cgPz8gXCJcIik7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAocy5pbmNsdWRlcyhcImh0dHAgcHJveHkgZXJyb3JcIikgfHwgcy5pbmNsdWRlcyhcIndzIHByb3h5IGVycm9yXCIpIHx8IHMuaW5jbHVkZXMoXCJ3cyBwcm94eSBzb2NrZXQgZXJyb3JcIikpICYmXHJcbiAgICAgIChzLmluY2x1ZGVzKFwiRUNPTk5SRUZVU0VEXCIpIHx8IHMuaW5jbHVkZXMoXCJFVElNRURPVVRcIikgfHwgcy5pbmNsdWRlcyhcIkVOT1RGT1VORFwiKSB8fCBzLmluY2x1ZGVzKFwiRUNPTk5SRVNFVFwiKSB8fCBzLmluY2x1ZGVzKFwiRUNPTk5BQk9SVEVEXCIpKVxyXG4gICAgKTtcclxuICB9O1xyXG4gIHJldHVybiB7XHJcbiAgICAuLi5iYXNlLFxyXG4gICAgZXJyb3I6IChtc2csIG9wdGlvbnMpID0+IHtcclxuICAgICAgaWYgKGRyb3AobXNnKSkgcmV0dXJuO1xyXG4gICAgICBiYXNlLmVycm9yKG1zZywgb3B0aW9ucyk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpO1xyXG4gIC8vIFVzZSBsb2NhbGhvc3QgKG5vdCAxMjcuMC4wLjEpIHNvIGNoYW5nZU9yaWdpbiBkb2VzIG5vdCBtYWtlIHRoZSBBUEkgdHJlYXQgXCIxMjdcIiBhcyBhIHRlbmFudCBzdWJkb21haW5cclxuICBjb25zdCBwcm94eVRhcmdldCA9IGVudi5WSVRFX0RFVl9QUk9YWV9UQVJHRVQ/LnRyaW0oKSB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICByZXR1cm4ge1xyXG4gIGN1c3RvbUxvZ2dlcjogbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiID8gY3JlYXRlUXVpZXRQcm94eUxvZ2dlcigpIDogdW5kZWZpbmVkLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgfSxcclxuICAgIC8vIEFsbG93IHN1YmRvbWFpbiBhY2Nlc3MgbGlrZSBzb2EubG9jYWxob3N0OjgwODBcclxuICAgIGFsbG93ZWRIb3N0czogXCJhbGxcIixcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIFwiL2FwaVwiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBwcm94eVRhcmdldCxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgICAgXCIvdXBsb2Fkc1wiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBwcm94eVRhcmdldCxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgICAgLy8gU29ja2V0LklPIChuYW1lc3BhY2VzIC9saXZlLCAvYmF0dGxlLCBcdTIwMjYpIHNvIGRldiB3b3JrcyBvbiBsb2NhbGhvc3Qgb3IgTEFOIElQXHJcbiAgICAgIFwiL3NvY2tldC5pb1wiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBwcm94eVRhcmdldCxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgd3M6IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXCJhZ29yYS1ydGMtc2RrLW5nXCJdLFxyXG4gIH0sXHJcbn07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdRLFNBQVMsY0FBYyxTQUFTLG9CQUFpQztBQUNqVSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLFNBQVMseUJBQWlDO0FBQ3hDLFFBQU0sT0FBTyxhQUFhO0FBQzFCLFFBQU0sT0FBTyxDQUFDLFFBQWlCO0FBQzdCLFVBQU0sSUFBSSxPQUFPLFFBQVEsV0FBVyxNQUFNLE9BQU8sT0FBTyxFQUFFO0FBQzFELFlBQ0csRUFBRSxTQUFTLGtCQUFrQixLQUFLLEVBQUUsU0FBUyxnQkFBZ0IsS0FBSyxFQUFFLFNBQVMsdUJBQXVCLE9BQ3BHLEVBQUUsU0FBUyxjQUFjLEtBQUssRUFBRSxTQUFTLFdBQVcsS0FBSyxFQUFFLFNBQVMsV0FBVyxLQUFLLEVBQUUsU0FBUyxZQUFZLEtBQUssRUFBRSxTQUFTLGNBQWM7QUFBQSxFQUU5STtBQUNBLFNBQU87QUFBQSxJQUNMLEdBQUc7QUFBQSxJQUNILE9BQU8sQ0FBQyxLQUFLLFlBQVk7QUFDdkIsVUFBSSxLQUFLLEdBQUcsRUFBRztBQUNmLFdBQUssTUFBTSxLQUFLLE9BQU87QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFDRjtBQUdBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUUzQyxRQUFNLGNBQWMsSUFBSSx1QkFBdUIsS0FBSyxLQUFLO0FBRXpELFNBQU87QUFBQSxJQUNQLGNBQWMsU0FBUyxnQkFBZ0IsdUJBQXVCLElBQUk7QUFBQSxJQUNsRSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsTUFDWDtBQUFBO0FBQUEsTUFFQSxjQUFjO0FBQUEsTUFDZCxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBLFFBQ0EsWUFBWTtBQUFBLFVBQ1YsUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBLFFBQ1Y7QUFBQTtBQUFBLFFBRUEsY0FBYztBQUFBLFVBQ1osUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsSUFBSTtBQUFBLFVBQ0osUUFBUTtBQUFBLFFBQ1Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLGlCQUFpQixnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLElBQzlFLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxrQkFBa0I7QUFBQSxJQUM5QjtBQUFBLEVBQ0Y7QUFDQSxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
