// vite.config.ts
import { defineConfig, loadEnv, createLogger } from "file:///C:/EDDVA%20SCHOOL/eddva_frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/EDDVA%20SCHOOL/eddva_frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/EDDVA%20SCHOOL/eddva_frontend/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\EDDVA SCHOOL\\eddva_frontend";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxFRERWQSBTQ0hPT0xcXFxcZWRkdmFfZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXEVERFZBIFNDSE9PTFxcXFxlZGR2YV9mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovRUREVkElMjBTQ0hPT0wvZWRkdmFfZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYsIGNyZWF0ZUxvZ2dlciwgdHlwZSBMb2dnZXIgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuXHJcbi8qKiBPbWl0IFZpdGUncyBkZWZhdWx0IFwiW3ZpdGVdIGh0dHAgcHJveHkgZXJyb3IgXHUyMDI2IEVDT05OUkVGVVNFRFwiIHNwYW0gd2hlbiB0aGUgQVBJIGlzIGRvd24uICovXHJcbmZ1bmN0aW9uIGNyZWF0ZVF1aWV0UHJveHlMb2dnZXIoKTogTG9nZ2VyIHtcclxuICBjb25zdCBiYXNlID0gY3JlYXRlTG9nZ2VyKCk7XHJcbiAgY29uc3QgZHJvcCA9IChtc2c6IHVua25vd24pID0+IHtcclxuICAgIGNvbnN0IHMgPSB0eXBlb2YgbXNnID09PSBcInN0cmluZ1wiID8gbXNnIDogU3RyaW5nKG1zZyA/PyBcIlwiKTtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIChzLmluY2x1ZGVzKFwiaHR0cCBwcm94eSBlcnJvclwiKSB8fCBzLmluY2x1ZGVzKFwid3MgcHJveHkgZXJyb3JcIikgfHwgcy5pbmNsdWRlcyhcIndzIHByb3h5IHNvY2tldCBlcnJvclwiKSkgJiZcclxuICAgICAgKHMuaW5jbHVkZXMoXCJFQ09OTlJFRlVTRURcIikgfHwgcy5pbmNsdWRlcyhcIkVUSU1FRE9VVFwiKSB8fCBzLmluY2x1ZGVzKFwiRU5PVEZPVU5EXCIpIHx8IHMuaW5jbHVkZXMoXCJFQ09OTlJFU0VUXCIpIHx8IHMuaW5jbHVkZXMoXCJFQ09OTkFCT1JURURcIikpXHJcbiAgICApO1xyXG4gIH07XHJcbiAgcmV0dXJuIHtcclxuICAgIC4uLmJhc2UsXHJcbiAgICBlcnJvcjogKG1zZywgb3B0aW9ucykgPT4ge1xyXG4gICAgICBpZiAoZHJvcChtc2cpKSByZXR1cm47XHJcbiAgICAgIGJhc2UuZXJyb3IobXNnLCBvcHRpb25zKTtcclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XHJcbiAgLy8gVXNlIGxvY2FsaG9zdCAobm90IDEyNy4wLjAuMSkgc28gY2hhbmdlT3JpZ2luIGRvZXMgbm90IG1ha2UgdGhlIEFQSSB0cmVhdCBcIjEyN1wiIGFzIGEgdGVuYW50IHN1YmRvbWFpblxyXG4gIGNvbnN0IHByb3h5VGFyZ2V0ID0gZW52LlZJVEVfREVWX1BST1hZX1RBUkdFVD8udHJpbSgpIHx8IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCI7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgY3VzdG9tTG9nZ2VyOiBtb2RlID09PSBcImRldmVsb3BtZW50XCIgPyBjcmVhdGVRdWlldFByb3h5TG9nZ2VyKCkgOiB1bmRlZmluZWQsXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcclxuICAgIHBvcnQ6IDgwODAsXHJcbiAgICBobXI6IHtcclxuICAgICAgb3ZlcmxheTogZmFsc2UsXHJcbiAgICB9LFxyXG4gICAgLy8gQWxsb3cgc3ViZG9tYWluIGFjY2VzcyBsaWtlIHNvYS5sb2NhbGhvc3Q6ODA4MFxyXG4gICAgYWxsb3dlZEhvc3RzOiBcImFsbFwiLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IHByb3h5VGFyZ2V0LFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgICBcIi91cGxvYWRzXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IHByb3h5VGFyZ2V0LFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBTb2NrZXQuSU8gKG5hbWVzcGFjZXMgL2xpdmUsIC9iYXR0bGUsIFx1MjAyNikgc28gZGV2IHdvcmtzIG9uIGxvY2FsaG9zdCBvciBMQU4gSVBcclxuICAgICAgXCIvc29ja2V0LmlvXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IHByb3h5VGFyZ2V0LFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICB3czogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcImFnb3JhLXJ0Yy1zZGstbmdcIl0sXHJcbiAgfSxcclxufTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1IsU0FBUyxjQUFjLFNBQVMsb0JBQWlDO0FBQ3JWLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsU0FBUyx5QkFBaUM7QUFDeEMsUUFBTSxPQUFPLGFBQWE7QUFDMUIsUUFBTSxPQUFPLENBQUMsUUFBaUI7QUFDN0IsVUFBTSxJQUFJLE9BQU8sUUFBUSxXQUFXLE1BQU0sT0FBTyxPQUFPLEVBQUU7QUFDMUQsWUFDRyxFQUFFLFNBQVMsa0JBQWtCLEtBQUssRUFBRSxTQUFTLGdCQUFnQixLQUFLLEVBQUUsU0FBUyx1QkFBdUIsT0FDcEcsRUFBRSxTQUFTLGNBQWMsS0FBSyxFQUFFLFNBQVMsV0FBVyxLQUFLLEVBQUUsU0FBUyxXQUFXLEtBQUssRUFBRSxTQUFTLFlBQVksS0FBSyxFQUFFLFNBQVMsY0FBYztBQUFBLEVBRTlJO0FBQ0EsU0FBTztBQUFBLElBQ0wsR0FBRztBQUFBLElBQ0gsT0FBTyxDQUFDLEtBQUssWUFBWTtBQUN2QixVQUFJLEtBQUssR0FBRyxFQUFHO0FBQ2YsV0FBSyxNQUFNLEtBQUssT0FBTztBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUNGO0FBR0EsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFFBQU0sY0FBYyxJQUFJLHVCQUF1QixLQUFLLEtBQUs7QUFFekQsU0FBTztBQUFBLElBQ1AsY0FBYyxTQUFTLGdCQUFnQix1QkFBdUIsSUFBSTtBQUFBLElBQ2xFLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILFNBQVM7QUFBQSxNQUNYO0FBQUE7QUFBQSxNQUVBLGNBQWM7QUFBQSxNQUNkLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsUUFDQSxZQUFZO0FBQUEsVUFDVixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsUUFDVjtBQUFBO0FBQUEsUUFFQSxjQUFjO0FBQUEsVUFDWixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxJQUFJO0FBQUEsVUFDSixRQUFRO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDOUUsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYztBQUFBLE1BQ1osU0FBUyxDQUFDLGtCQUFrQjtBQUFBLElBQzlCO0FBQUEsRUFDRjtBQUNBLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
