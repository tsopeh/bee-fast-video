/** Formats seconds as `m:ss`, or `h:mm:ss` from one hour on. Non-finite input (unknown duration) gives `--:--`. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "--:--"
  }
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = s.toString().padStart(2, "0")
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`
}
