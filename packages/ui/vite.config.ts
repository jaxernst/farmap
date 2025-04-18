import { sveltekit } from "@sveltejs/kit/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [tailwindcss(), sveltekit()],
    server: {
      proxy: {
        "/api": {
          target: "https://adequate-adaptation-production.up.railway.app",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      },
      allowedHosts: true
    }
  }
})
