import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rafael =
    env.VITE_API_BASE?.replace(/\/$/, "") ||
    "https://merger-fish-gets-peace.trycloudflare.com";

  return {
    server: {
      port: 5173,
      proxy: {
        "/api/voz": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        // Cobros + SSE → Rafael (evita CORS en local; el front usa paths relativos en DEV)
        "/api/cobros": {
          target: rafael,
          changeOrigin: true,
          secure: true,
        },
        "/api/eventos": {
          target: rafael,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
