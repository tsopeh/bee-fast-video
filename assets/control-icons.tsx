// Find more SVG icons here: https://fontawesome.com/search
// Optimize SVGs here: https://jakearchibald.github.io/svgomg/

import type { ParentProps } from "solid-js"

export function SlashIcon(props: ParentProps) {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <g>{props.children}</g>
      <path
        fill="#ff0000"
        d="M5.1 9.2a24 24 0 0 1 33.7-4.1l592 464a24 24 0 0 1-29.6 37.8l-592-464A24 24 0 0 1 5.1 9.2z"
      />
    </svg>
  )
}

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

// The playback speed icon used by YouTube.
export function SpeedIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 1c1.44 0 2.87.28 4.21.83a11 11 0 0 1 3.45 2.27l-1.81 1.05A9 9 0 0 0 3 12a9 9 0 0 0 18-.00l-.01-.44a8.99 8.99 0 0 0-.14-1.20l1.81-1.05A11.00 11.00 0 0 1 10.51 22.9 11 11 0 0 1 12 1Zm7.08 6.25-7.96 3.25a1.74 1.74 0 1 0 1.73 2.99l6.8-5.26a.57.57 0 0 0-.56-.98Z" />
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

export function PictureInPictureIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
      <path d="M160 80h352a16 16 0 0 1 16 16v224a16 16 0 0 1-16 16h-21.2L388.1 178.9a24 24 0 0 0-40.2 0l-52.2 79.8-12.4-16.9a24 24 0 0 0-38.8 0L175.6 336H160a16 16 0 0 1-16-16V96a16 16 0 0 1 16-16zM96 96v224a64 64 0 0 0 64 64h352a64 64 0 0 0 64-64V96a64 64 0 0 0-64-64H160a64 64 0 0 0-64 64zm-48 24a24 24 0 1 0-48 0v224a136 136 0 0 0 136 136h320a24 24 0 1 0 0-48H136a88 88 0 0 1-88-88V120zm208 24a32 32 0 1 0-64 0 32 32 0 1 0 64 0z" />
    </svg>
  )
}

export function RemoveIcon() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
      <path d="M343 151a32 32 0 0 0-46-46L192 211 87 105a32 32 0 0 0-46 46l106 105L41 361a32 32 0 0 0 46 46l105-106 105 106a32 32 0 0 0 46-46L237 256l106-105z" />
    </svg>
  )
}
