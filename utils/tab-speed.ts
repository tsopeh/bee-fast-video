// The speed the user last set in this tab, kept in the page's `sessionStorage`. That storage belongs to one site in one
// tab: it survives reloads and moving between the site's pages, but a new tab starts empty. So a tab keeps its speed,
// and a video opened in a new tab plays at the site's own speed. The page can see and clear the key.

const KEY = "beeFastVideo.speed"

type SpeedStorage = () => Pick<Storage, "getItem" | "setItem">

/**
 * The tab's speed, or `undefined` when there's none or the storage can't be read. Reading `sessionStorage` throws in
 * frames whose storage is blocked, like a sandboxed iframe or a third-party frame with cookies blocked.
 */
export function readTabSpeed(storage: SpeedStorage = () => sessionStorage): number | undefined {
  try {
    const speed = Number(storage().getItem(KEY) ?? Number.NaN)
    return Number.isFinite(speed) && speed > 0 ? speed : undefined
  } catch {
    return undefined
  }
}

export function writeTabSpeed(speed: number, storage: SpeedStorage = () => sessionStorage) {
  try {
    storage().setItem(KEY, String(speed))
  } catch {}
}
