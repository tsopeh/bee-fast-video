import { resolve } from "path"
import * as process from "process"
import { defineConfig } from "vite"
import checker from "vite-plugin-checker"
import solidPlugin from "vite-plugin-solid"
import makeManifest from "./src/make-manifest.ts"

const src = resolve(import.meta.dirname, "src")
const outDir = resolve(import.meta.dirname, "dist")
const publicDir = resolve(import.meta.dirname, "public")

// https://github.com/rollup/rollup/issues/2756
// Rollup (and Rolldown, since Vite 8) automatically chunks common code for multiple inputs, and cannot
// build completely independent outputs. This is why we run build multiple
// times with different input. God, I hate this!

const rawInput = process.env.VITE_INPUT
const isValidEnvVariable = typeof rawInput == "string" && (rawInput == "content" || rawInput == "popup")
if (!isValidEnvVariable) {
  throw new Error("Env variable must be set to `content` or `popup` to support independent building building.")
}

const rollupInput: Record<string, string> = rawInput == "content"
  ? { content: resolve(src, "content", "index.tsx") }
  : { popup: resolve(src, "popup", "index.html") }

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      makeManifest(),
      solidPlugin(),
      checker({ typescript: true }),
    ],
    publicDir,
    build: {
      outDir,
      rolldownOptions: {
        input: rollupInput,
        output: {
          entryFileNames: (chunk) => `src/${chunk.name}/index.js`,
        },
      },
      sourcemap: mode == "development" ? "inline" : undefined,
      emptyOutDir: false,
    },
  }
})
