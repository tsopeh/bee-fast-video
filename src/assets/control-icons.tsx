// Find more SVG icons here: https://fontawesome.com/search
// Optimize SVGs here: https://jakearchibald.github.io/svgomg/

import { ParentProps } from "solid-js"

export function SlashIcon (props: ParentProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
    <g>
      {props.children}
    </g>
    <path fill="#ff0000" d="M5.1 9.2a24 24 0 0 1 33.7-4.1l592 464a24 24 0 0 1-29.6 37.8l-592-464A24 24 0 0 1 5.1 9.2z" />
  </svg>
}

export function SpeedUpIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M256 80a32 32 0 1 0-64 0v144H48a32 32 0 1 0 0 64h144v144a32 32 0 1 0 64 0V288h144a32 32 0 1 0 0-64H256V80z" />
  </svg>
}

export function SlowDownIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M432 256a32 32 0 0 1-32 32H48a32 32 0 1 1 0-64h352a32 32 0 0 1 32 32z" />
  </svg>
}

export function PlayIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
    <path d="M73 39A48 48 0 0 0 0 80v352a48 48 0 0 0 73 41l288-176a48 48 0 0 0 0-82L73 39z" />
  </svg>
}

export function PauseIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
    <path
      d="M48 64C22 64 0 86 0 112v288c0 27 22 48 48 48h32c27 0 48-21 48-48V112c0-26-21-48-48-48H48zm192 0c-26 0-48 22-48 48v288c0 27 22 48 48 48h32c27 0 48-21 48-48V112c0-26-21-48-48-48h-32z"
    />
  </svg>
}

export function BackwardIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path
      d="M459.5 440.6A32 32 0 0 0 512 416V96a32 32 0 0 0-52.5-24.6L288 214.3v83.4l171.5 142.9zM256 352V96a32 32 0 0 0-52.5-24.6l-192 160a32 32 0 0 0 0 49.2l192 160A32 32 0 0 0 256 416v-64z"
    />
  </svg>
}

export function ForwardIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path
      d="M52.5 440.6A32 32 0 0 1 0 416V96a32 32 0 0 1 52.5-24.6L224 214.3v83.4L52.5 440.6zM256 352V96a32 32 0 0 1 52.5-24.6l192 160a32 32 0 0 1 0 49.2l-192 160A32 32 0 0 1 256 416v-64z"
    />
  </svg>
}

export function RepeatIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path
      d="M0 224a32 32 0 1 0 64 0c0-53 43-96 96-96h160v32a32.1 32.1 0 0 0 54.7 22.7l64-64a32 32 0 0 0 0-45.3l-64-64A32 32 0 0 0 320 32v32H160A160 160 0 0 0 0 224zm512 64a32 32 0 1 0-64 0c0 53-43 96-96 96H192v-32a32.1 32.1 0 0 0-54.7-22.7l-64 64a32 32 0 0 0 0 45.3l64 64a32 32 0 0 0 54.7-22.7V448h160a160 160 0 0 0 160-160z"
    />
  </svg>
}

export function NativeControlsIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <path
      d="M0 432a32 32 0 0 0 32 32h54.7a79.8 79.8 0 0 0 146.6 0H480a32 32 0 1 0 0-64H233.3a79.8 79.8 0 0 0-146.6 0H32a32 32 0 0 0-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1-64 0z"
    />
    <g stroke="null">
      <path
        d="M472.2 49.6a56.6 56.6 0 0 0-40-40.1C397.2 0 256 0 256 0S115 0 79.7 9.5a56.6 56.6 0 0 0-39.9 40.1C30.4 85.1 30.4 159 30.4 159s0 73.9 9.4 109.3a55.8 55.8 0 0 0 40 39.5c35.1 9.5 176.2 9.5 176.2 9.5s141 0 176.3-9.5a55.9 55.9 0 0 0 39.9-39.5c9.4-35.4 9.4-109.3 9.4-109.3s0-73.8-9.4-109.3zM209.9 226V92l117.9 67-117.9 67z"
      />
    </g>
  </svg>
}

export function PictureInPictureIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
    <path
      d="M160 80h352a16 16 0 0 1 16 16v224a16 16 0 0 1-16 16h-21.2L388.1 178.9a24 24 0 0 0-40.2 0l-52.2 79.8-12.4-16.9a24 24 0 0 0-38.8 0L175.6 336H160a16 16 0 0 1-16-16V96a16 16 0 0 1 16-16zM96 96v224a64 64 0 0 0 64 64h352a64 64 0 0 0 64-64V96a64 64 0 0 0-64-64H160a64 64 0 0 0-64 64zm-48 24a24 24 0 1 0-48 0v224a136 136 0 0 0 136 136h320a24 24 0 1 0 0-48H136a88 88 0 0 1-88-88V120zm208 24a32 32 0 1 0-64 0 32 32 0 1 0 64 0z"
    />
  </svg>
}

export function RemoveIcon () {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
    <path
      d="M343 151a32 32 0 0 0-46-46L192 211 87 105a32 32 0 0 0-46 46l106 105L41 361a32 32 0 0 0 46 46l105-106 105 106a32 32 0 0 0 46-46L237 256l106-105z"
    />
  </svg>
}
