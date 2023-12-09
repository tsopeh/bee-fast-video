import * as packageJson from "../package.json"
import { ManifestType } from "./manifest-type"

const manifest: ManifestType = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  action: {
    default_popup: "src/popup/index.html",
    default_icon: "icon-34.png",
  },
  icons: {
    "128": "icon-128.png",
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "<all_urls>"],
      js: ["src/content/index.js"],
      all_frames: true,
    },
  ],
  web_accessible_resources: [
    {
      resources: ["icon-128.png", "icon-34.png"],
      matches: [],
    },
  ],
}

export default manifest
