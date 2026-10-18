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
- The popup's list of controls and shortcuts is written by hand. Update it with any change to controls or shortcuts.

## Checking your work

Run `npm run check` and `npm test` before calling anything done.

Unit tests can't show whether the UI works. For UI changes, also check in a real browser. So far that has meant Chrome for Testing driven by `puppeteer-core`, both installed in a scratch folder outside the repo, never as project dependencies. Serve test pages over HTTP. Load test videos as blob URLs, because Python's `http.server` doesn't support range requests and seeking fails without them.

Not yet checked by hand: running in Firefox (only `web-ext lint` was run), and behavior on real sites such as YouTube and Instagram. Say so when it matters.
