import { BackwardIcon, ForwardIcon, NativeControlsIcon, PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon, RepeatIcon, SlowDownIcon, SpeedUpIcon } from "../assets/control-icons"
import iconLarge from "../assets/icon-large.png"
import popupCss from "./popup.scss?inline"

export function Popup () {
  return (
    <>
      <style>{popupCss}</style>
      <main>
        <img
          class="logo"
          src={iconLarge}
          alt="Bee holding a red play-video button." />
        <div class="title">Bee Fast Video</div>
        <table>
          <thead>
          <tr>
            <th>
              Button
            </th>
            <th>
              What it does
            </th>
            <th>
              Shortcut
            </th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>
              <div class="icon"><SlowDownIcon /></div>
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
              <div class="icon"><SpeedUpIcon /></div>
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
              <div class="icon"><BackwardIcon /></div>
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
              <div class="icon"><PlayIcon /><span class="separator">|</span><PauseIcon /></div>
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
              <div class="icon"><ForwardIcon /></div>
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
              <div class="icon"><RepeatIcon /></div>
            </td>
            <td>
              <div class="action">Loop</div>
            </td>
            <td>
              <div class="key-wrapper">
                /
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon"><NativeControlsIcon /></div>
            </td>
            <td>
              <div class="action">Native controls</div>
            </td>
            <td>
              <div class="key-wrapper">
                /
              </div>
            </td>
          </tr>
          <tr class="row-gap" />
          <tr>
            <td>
              <div class="icon"><PictureInPictureIcon /></div>
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
              <div class="icon"><RemoveIcon /></div>
            </td>
            <td>
              <div class="action">Disable</div>
            </td>
            <td>
              <div class="key-wrapper">
                <KeyboardKey keyboardKey="B" />
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </main>
    </>
  )
}

function KeyboardKey (props: { keyboardKey: string }) {
  return <div class="keyboard-key">{props.keyboardKey}</div>
}
