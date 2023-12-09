import preact from "@preact/preset-vite"
import { resolve } from "path"
import { defineConfig } from "vite"
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js"
import makeManifest from "./src/make-manifest"

const src = resolve(__dirname, "src")
const assetsDir = resolve(src, "assets")
const outDir = resolve(__dirname, "dist")
const publicDir = resolve(__dirname, "public")

export default defineConfig({
  plugins: [
    makeManifest(),
    preact(),
    cssInjectedByJsPlugin({
      relativeCSSInjection: true,
    })],
  publicDir,
  build: {
    outDir,
    rollupOptions: {
      input: {
        content: resolve(src, "content", "index.ts"),
        popup: resolve(src, "popup", "index.html"),
      },
      output: {
        entryFileNames: chunk => `src/${chunk.name}/index.js`,
      },
    },
  },
})
