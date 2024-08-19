import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'
import { comlink } from "vite-plugin-comlink";


export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        "name": "Swolog Fitness Tracker",
        "short_name": "Swolog",
        "lang": "en-US",
        "start_url": "/index.html",
        "display": "standalone",
        "background_color": "#30303B",
        "theme_color": "#FF6C00",
        "icons": [{
          "src": "images/icons/swolog-128.png",
          "sizes": "128x128",
          "type": "image/png"
        }, {
          "src": "images/icons/swolog-144.png",
          "sizes": "144x144",
          "type": "image/png"
        }, {
          "src": "images/icons/swolog-152.png",
          "sizes": "152x152",
          "type": "image/png"
        }, {
          "src": "images/icons/swolog-192.png",
          "sizes": "192x192",
          "type": "image/png"
        }, {
          "src": "images/icons/swolog-256.png",
          "sizes": "256x256",
          "type": "image/png"
        }, {
          "src": "images/icons/swolog-512.png",
          "sizes": "512x512",
          "type": "image/png"
        }
        ]
      }
    }),
    comlink(),
  ],
  worker: {
    plugins: () => [comlink()],
  },
})