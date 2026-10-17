export interface VideoTraits {
  /** Visible area in px². */
  area: number
  isPlaying: boolean
}

/**
 * Picks the single video that keyboard shortcuts should control:
 * 1. the video the user last interacted with (hover, click), if it's still a candidate;
 * 2. otherwise a playing video over a paused one, and the larger one among equals.
 *
 * Controlling only one video matters on pages with many visible videos (feeds), where acting on all of them at once
 * is rarely what the user wants.
 */
export function pickTargetVideo<T>(
  candidates: Iterable<T>,
  lastInteracted: T | undefined,
  getTraits: (video: T) => VideoTraits,
): T | undefined {
  let best: { video: T; traits: VideoTraits } | undefined
  for (const video of candidates) {
    if (video === lastInteracted) {
      return video
    }
    const traits = getTraits(video)
    const isBetter =
      best === undefined ||
      (traits.isPlaying && !best.traits.isPlaying) ||
      (traits.isPlaying === best.traits.isPlaying && traits.area > best.traits.area)
    if (isBetter) {
      best = { video, traits }
    }
  }
  return best?.video
}
