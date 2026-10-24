# Notes for agents

Read the README first. It says what the extension does and how it fits together. This file holds what the code and the README don't: how to write, and how the owner likes to work.

## Writing style

Docs, comments, commit messages and replies all use the same plain style. Think of how Paul Graham writes essays.

- Use simple words. Say "the page can't block it", not "ensures robust event interception".
- Short sentences. One idea each.
- Cut every word that doesn't add meaning. If a comment only repeats the code, delete it.
- Explain why, not what. The code already says what.
- Be concrete. Give the number, the browser version, the error message, the site.
- Don't oversell. No "powerful", "seamless", "robust".
- Never make up a reason. If you don't know why something is the way it is, don't invent one.
- Write for a smart reader who doesn't know this code yet.

Commit messages: a short summary line, then the changes as a list, each with its reason, and what was checked and how. These messages are read later to recover why things were done.

## Working with the owner

- The owner is opinionated about tools. Ask before adding a dependency, a config file or a new tool, or before changing how an existing one is set up. No Tailwind, and no extras "just in case".
- Commit only when asked. Push only when asked. When asked to hold off, leave the changes for the owner to build and test.
- When a request is unclear or a choice is a real trade-off, ask first. Put the options as numbered questions, each with a recommended answer. Don't ask about things you can find out yourself.
- The UI must not grow. Better layout is welcome; a bigger panel isn't.
- No delays before showing or reacting. A settle delay and a hover delay were tried and removed on purpose.

## Product rules

- TypeScript, Solid 1.x (not 2), plain CSS. All content script UI lives in the shadow root.
- It must work in Chrome and Firefox. Other browsers are a bonus.
- Speed, seek and volume changes are relative to the current value. Never snap them to a grid, or going back and forth while a video plays gets stuck in the same window.
- Scrolling over a control steps by time (at most one step per interval), not per wheel event, so trackpads and mouse wheels feel the same.
- Keep the storage keys. `sync:blacklistedHostnames` dates from v1, and renaming it would wipe users' settings.
- Only speeds the user sets through the extension (buttons, keys, wheel, right-click) are remembered. Speeds the site sets itself are shown but never saved.
- In fullscreen, Chrome only lets you click inside the fullscreen element. That's why the panels' host moves into it (`host.ts`). Don't try to fix the bare `<video>` case with a modal dialog: it would make the video itself unclickable.

## Checking your work

Run `npm run check`, `npm test` and `npm run test:e2e` before calling anything done. The browser tests need `npm run e2e:install` once. They run in Chrome and then in Firefox. Test files run in parallel, each with its own browser; use the helpers in `e2e/harness.ts`.

For a UI change, also look at it: take a screenshot with Puppeteer and view it. Numbers alone miss spacing and color problems.

When you change what the user sees or does, also:

1. update the popup's lists (`entrypoints/popup/Popup.tsx`), which are written by hand;
2. add or change a browser test in `e2e/`, with a page in `e2e/pages` that copies the real site's layout when a site is the reason;
3. run `npm run screenshots` and look at the new pictures in `docs/`;
4. update the README.

To see how a real site works, use Puppeteer against the live site from a scratch folder, then copy the layout into a test page. Don't make the tests depend on live sites.

The owner has loaded the extension in a real Firefox as a temporary add-on, and it worked. Real sites are mostly unchecked. Reddit was checked with a Puppeteer script in Chrome and Firefox: the panel shows, and keys and clicks work. Say so when it matters.
