import { resolve } from "path";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: "src/",

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        // search: resolve(__dirname, "src/search/index.html"),
        // account: resolve(__dirname, "src/account/index.html"),
        // lists: resolve(__dirname, "src/lists/index.html")
      },
    },
  },
  plugins: [
    tailwindcss(),
  ],
});
