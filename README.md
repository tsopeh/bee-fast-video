# Bee fast video

<img src="docs/intro.png" alt="Bee fast video banner" width=640>

**Bee fast video** is a browser extension that offers greater control over videos on all websites.

# You can

<img src="docs/popup.png" alt="Controls" width=350>

- speed up (`X`) and slow down any video (`Z`)
- seek forward (`D`) and backward (`A`) through any video
- play and pause (`S`) any video
- bring to front and enable native video controls for any video
- toggle loop for any video
- toggle Picture-in-Picture (`P`) for any video

### Development notes

The extension was made based on a [preact template](https://github.com/fell-lucas/chrome-extension-template-preact-vite), with most of the _extra_ stuff removed. The extension consists of the content script and a popup. These to components do not communicate in any way.

**Content script**

Most of the important bits are located within the content script. 

**Popup**

The popup is there to present functionality and shortcuts to the user. It must be manually kept in sync if either the functionality or shortcuts change.

**Styles**

Styles are written in SCSS and are imported as transformed CSS `text`. This text is then used as content for the `<style>...</style>` tag. 

```typescript jsx
import cssText from "./some.scss";

<style>{cssText}</style>
```
This setup circumvents issues related to processing and bundling of the styles. We want to keep the styles completely separate for the content script and the popup. Another benefit of this setup is that we don't have to declare each `.css` file in the extension manifest for the [content script](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).

<p align=center>
  <img align=center src="docs/logo.png" alt="Be fast video logo" width=200>
</p>