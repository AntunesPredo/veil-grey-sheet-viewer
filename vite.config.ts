import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Veil Grey - Terminal HUD",
        short_name: "Veil Grey",
        description: "Interface Utilitária para o RPG Veil Grey.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/veil-grey-hud/",
        scope: "/veil-grey-hud/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        handle_links: "preferred",
        launch_handler: {
          client_mode: ["focus-existing", "auto"],
        },
      },
    }),
  ],
  base: "/veil-grey-hud/",
});
