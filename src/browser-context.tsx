export function getBrowser (): typeof chrome {
  const _chrome: typeof chrome | undefined = typeof chrome !== "undefined" ? chrome : undefined
  // @ts-expect-error
  // eslint-disable-next-line no-undef
  const _browser: typeof chrome | undefined = typeof browser !== "undefined" ? browser : undefined
  const result = _chrome ?? _browser
  if (!result) {
    throw new Error("Browser context not found")
  }
  return result
}