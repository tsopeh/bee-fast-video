/**
 * Videos smaller than this (in either dimension) are not worth a panel: they're usually decorative (icons,
 * avatars, animated stickers), tracking/preloading players, or players collapsed to almost nothing.
 */
export const MIN_VIDEO_SIZE_PX = 50

/**
 * Heuristics deciding whether a video gets a panel (besides being in the viewport, which is tracked separately
 * with an `IntersectionObserver`). Many pages keep hidden or tiny videos in the DOM (preloaded next videos, hidden
 * players, background effects); showing panels for those only gets in the user's way. Pass the video's size when the
 * caller already has it, to skip measuring it again.
 */
export function isVideoVisibleEnough(
  videoEl: HTMLVideoElement,
  { width, height }: { width: number; height: number } = videoEl.getBoundingClientRect(),
): boolean {
  if (width < MIN_VIDEO_SIZE_PX || height < MIN_VIDEO_SIZE_PX) {
    return false
  }
  // `checkVisibility` covers `display: none`, `content-visibility: hidden`, `visibility: hidden` and `opacity: 0` on
  // the video *and its ancestors*, which checking the video's own computed style would miss.
  // Chrome 105+, Firefox 106+; assume visible elsewhere.
  if (typeof videoEl.checkVisibility === "function") {
    return videoEl.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  }
  return true
}
