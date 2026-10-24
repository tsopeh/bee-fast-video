// Find more SVG icons here: https://fontawesome.com/search
// Optimize SVGs here: https://jakearchibald.github.io/svgomg/

export function SpeedUpIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <path d="M256 80a32 32 0 1 0-64 0v144H48a32 32 0 1 0 0 64h144v144a32 32 0 1 0 64 0V288h144a32 32 0 1 0 0-64H256V80z" />
    </svg>
  )
}

export function SlowDownIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <path d="M432 256a32 32 0 0 1-32 32H48a32 32 0 1 1 0-64h352a32 32 0 0 1 32 32z" />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
      <path d="M73 39A48 48 0 0 0 0 80v352a48 48 0 0 0 73 41l288-176a48 48 0 0 0 0-82L73 39z" />
    </svg>
  )
}

export function PauseIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
      <path d="M48 64C22 64 0 86 0 112v288c0 27 22 48 48 48h32c27 0 48-21 48-48V112c0-26-21-48-48-48H48zm192 0c-26 0-48 22-48 48v288c0 27 22 48 48 48h32c27 0 48-21 48-48V112c0-26-21-48-48-48h-32z" />
    </svg>
  )
}

export function BackwardIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="M459.5 440.6A32 32 0 0 0 512 416V96a32 32 0 0 0-52.5-24.6L288 214.3v83.4l171.5 142.9zM256 352V96a32 32 0 0 0-52.5-24.6l-192 160a32 32 0 0 0 0 49.2l192 160A32 32 0 0 0 256 416v-64z" />
    </svg>
  )
}

export function ForwardIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="M52.5 440.6A32 32 0 0 1 0 416V96a32 32 0 0 1 52.5-24.6L224 214.3v83.4L52.5 440.6zM256 352V96a32 32 0 0 1 52.5-24.6l192 160a32 32 0 0 1 0 49.2l-192 160A32 32 0 0 1 256 416v-64z" />
    </svg>
  )
}

export function RepeatIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="M0 224a32 32 0 1 0 64 0c0-53 43-96 96-96h160v32a32.1 32.1 0 0 0 54.7 22.7l64-64a32 32 0 0 0 0-45.3l-64-64A32 32 0 0 0 320 32v32H160A160 160 0 0 0 0 224zm512 64a32 32 0 1 0-64 0c0 53-43 96-96 96H192v-32a32.1 32.1 0 0 0-54.7-22.7l-64 64a32 32 0 0 0 0 45.3l64 64a32 32 0 0 0 54.7-22.7V448h160a160 160 0 0 0 160-160z" />
    </svg>
  )
}

// 24×24 line icons. Strokes use `currentColor`, so they follow the widget's text color.
const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2.5,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
} as const

export function VolumeIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M3 9h4l5-4v14l-5-4H3z" />
      <path {...strokeProps} d="M16 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

export function MutedIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M3 9h4l5-4v14l-5-4H3z" />
      <path {...strokeProps} d="M16 9l6 6M22 9l-6 6" />
    </svg>
  )
}

// From Lucide (https://lucide.dev/icons/brain, ISC license).
export function BrainIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <g {...strokeProps} stroke-width="2">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
        <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
        <path d="M6 18a4 4 0 0 1-1.967-.516" />
        <path d="M19.967 17.484A4 4 0 0 1 18 18" />
      </g>
    </svg>
  )
}

/** A screen with two arrows pointing in: "shrink to fit the screen". */
export function FitScreenIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <g {...strokeProps} stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M5 10h5M8 7.5l2 2.5-2 2.5M19 10h-5M16 7.5l-2 2.5 2 2.5" />
      </g>
    </svg>
  )
}

export function GripIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 24">
      <circle cx="3" cy="6" r="2" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="3" cy="12" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="3" cy="18" r="2" />
      <circle cx="9" cy="18" r="2" />
    </svg>
  )
}

// "Hide" rather than an X, which reads as closing the video or the page. The panel only hides until the page reloads.
export function HideIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144 0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3-11.1-41.5-47.8-69.4-88.6-71.1-5.8-.2-9.2 6.1-7.4 11.7 2.1 6.4 3.3 13.2 3.3 20.3 0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1-79.5 0-144-64.5-144-144 0-6.9.5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z" />
    </svg>
  )
}
