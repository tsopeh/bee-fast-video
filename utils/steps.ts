// How far the speed and seek keys step, which the user can change in the popup. The step without Shift is also the
// step of the panel's buttons and of one scroll step.

export type StepName = "speed" | "shiftSpeed" | "seek" | "shiftSeek"

/** Speed steps are added to the playback rate. Seek steps are in seconds. */
export type Steps = Record<StepName, number>

export const DEFAULT_STEPS: Steps = { speed: 0.25, shiftSpeed: 0.1, seek: 5, shiftSeek: 20 }

const STEP_NAMES = Object.keys(DEFAULT_STEPS) as Array<StepName>

// Speeds are rounded to hundredths (see `adjustedPlaybackRate`), so a smaller speed step would do nothing. 16 is the
// fastest speed Chrome allows. Seek steps stop at an hour; 0.1 s is a frame or two.
const LIMITS: Record<"speed" | "seek", { min: number; max: number; decimals: number }> = {
  speed: { min: 0.01, max: 16, decimals: 2 },
  seek: { min: 0.1, max: 3600, decimals: 1 },
}
const limitsFor = (name: StepName) => LIMITS[name === "speed" || name === "shiftSpeed" ? "speed" : "seek"]

/** The steps with the user's changes. Only changed steps are stored, like the keys. */
export function resolveSteps(changed: Partial<Steps>): Steps {
  return { ...DEFAULT_STEPS, ...changed }
}

export function areDefaultSteps(steps: Steps): boolean {
  return STEP_NAMES.every((name) => steps[name] === DEFAULT_STEPS[name])
}

/** Only the steps that differ from the defaults, for storage. */
export function changedSteps(steps: Steps): Partial<Steps> {
  return Object.fromEntries(STEP_NAMES.filter((n) => steps[n] !== DEFAULT_STEPS[n]).map((n) => [n, steps[n]]))
}

/**
 * The step typed in the popup, or `undefined` if it isn't a number. A comma works as the decimal point, as many
 * keyboards type it. Values out of range are moved into it, and rounded to the precision the step can have.
 */
export function parseStep(name: StepName, text: string): number | undefined {
  const value = Number(text.trim().replace(",", "."))
  if (text.trim() === "" || !Number.isFinite(value)) {
    return undefined
  }
  const { min, max, decimals } = limitsFor(name)
  const rounded = Math.round(value * 10 ** decimals) / 10 ** decimals
  return Math.min(max, Math.max(min, rounded))
}

/** "1 second", "5 seconds", for tooltips. */
export function secondsLabel(seconds: number): string {
  return seconds === 1 ? "1 second" : `${seconds} seconds`
}
