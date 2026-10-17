import { Show } from "solid-js"
import {
  BackwardIcon,
  ForwardIcon,
  FullscreenIcon,
  GripIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  RemoveIcon,
  RepeatIcon,
  SlowDownIcon,
  SpeedUpIcon,
  VolumeIcon,
} from "@/assets/control-icons"
import iconLarge from "@/assets/icon-large.png"
import { useSettings } from "@/utils/settings"

export function Popup() {
  const { currentHostname, isDisabledOnThisDomain, toggleBlacklistHostName } = useSettings()

  return (
    <main>
      <img class="logo" src={iconLarge} alt="Bee holding a red play-video button." />
      <div class="title">Bee Fast Video</div>
      <button
        type="button"
        class={`toggle ${isDisabledOnThisDomain() ? "disabled" : "enabled"}`}
        onClick={() => {
          toggleBlacklistHostName()
        }}
      >
        <Show when={isDisabledOnThisDomain()} fallback={"Enabled"}>
          Disabled
        </Show>
        {" for"}
        <span class="hostname">&nbsp{currentHostname()}</span>
      </button>
      <table>
        <thead>
          <tr>
            <th>Button</th>
            <th>What it does</th>
            <th>Shortcut</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="icon">
                <SlowDownIcon />
              </div>
            </td>
            <td>
              <div class="action">Slow down</div>
            </td>
            <td>
              <div class="key-wrapper">
                <KeyboardKey keyboardKey="Z" />
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <SpeedUpIcon />
              </div>
            </td>
            <td>
              <div class="action">Speed up</div>
            </td>
            <td>
              <div class="key-wrapper">
                <KeyboardKey keyboardKey="X" />
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <BackwardIcon />
              </div>
            </td>
            <td>
              <div class="action">Backward</div>
            </td>
            <td>
              <div class="key-wrapper">
                <KeyboardKey keyboardKey="A" />
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <PlayIcon />
                <span class="separator">|</span>
                <PauseIcon />
              </div>
            </td>
            <td>
              <div class="action">Play | Pause</div>
            </td>
            <td>
              <div class="key-wrapper">
                <KeyboardKey keyboardKey="S" />
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <ForwardIcon />
              </div>
            </td>
            <td>
              <div class="action">Forward</div>
            </td>
            <td>
              <div class="key-wrapper">
                <KeyboardKey keyboardKey="D" />
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <RepeatIcon />
              </div>
            </td>
            <td>
              <div class="action">Loop</div>
            </td>
            <td>
              <div class="key-wrapper">/</div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <VolumeIcon />
              </div>
            </td>
            <td>
              <div class="action">Mute | Volume</div>
            </td>
            <td>
              <div class="key-wrapper">/</div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <FullscreenIcon />
              </div>
            </td>
            <td>
              <div class="action">Fullscreen</div>
            </td>
            <td>
              <div class="key-wrapper">/</div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <GripIcon />
              </div>
            </td>
            <td>
              <div class="action">Drag to move</div>
            </td>
            <td>
              <div class="key-wrapper">/</div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <PictureInPictureIcon />
              </div>
            </td>
            <td>
              <div class="action">Picture-in-Picture</div>
            </td>
            <td>
              <div class="key-wrapper">
                <KeyboardKey keyboardKey="P" />
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon">
                <RemoveIcon />
              </div>
            </td>
            <td>
              <div class="action">Disable</div>
            </td>
            <td>
              <div class="key-wrapper">/</div>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  )
}

function KeyboardKey(props: { keyboardKey: string }) {
  return <div class="keyboard-key">{props.keyboardKey}</div>
}
