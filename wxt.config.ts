import { defineConfig } from "wxt"

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ["@wxt-dev/module-solid"],
  outDir: "dist",
  // Explicit imports via `#imports` instead of auto-imported globals.
  imports: false,
  // MV3 everywhere; WXT would otherwise build MV2 for Firefox.
  manifestVersion: 3,
  // Don't launch a browser in dev mode (requires `web-ext`); load `dist/<browser>-mv3-dev` manually.
  webExt: { disabled: true },
  manifest: ({ browser }) => ({
    name: "Bee fast video",
    // `activeTab` exposes the current tab's URL to the popup, without the "Read your browsing history" warning of `tabs`.
    permissions: ["storage", "activeTab"],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "bee.fast.video@tsopeh.github.com",
          // `data_collection_permissions` needs 140, and the content script in the page's world (`shadow-roots.content.ts`)
          // needs 128. Older versions would install the add-on without them.
          strict_min_version: "140.0",
          data_collection_permissions: { required: ["none"] },
        },
      },
    }),
  }),
})
