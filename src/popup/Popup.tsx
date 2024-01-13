import { BackwardIcon, ForwardIcon, NativeControlsIcon, PauseIcon, PictureInPictureIcon, PlayIcon, RemoveIcon, RepeatIcon, SlowDownIcon, SpeedUpIcon } from "../assets/control-icons"
import iconLarge from "../assets/icon-large.png"
import popupCss from "./popup.scss?inline"

export const Popup = () => {
  return (
    <>
      <style>{popupCss}</style>
      <main>
        <img
          className="logo"
          src={iconLarge}
          alt="Bee holding a red play-video button." />
        <div className="title">Bee Fast Video</div>
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
              <div className="icon"><SlowDownIcon /></div>
            </td>
            <td>
              <div className="action">Slow down</div>
            </td>
            <td>
              <div className="key-wrapper">
                <KeyboardKey keyboardKey="Z" />
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><SpeedUpIcon /></div>
            </td>
            <td>
              <div className="action">Speed up</div>
            </td>
            <td>
              <div className="key-wrapper">
                <KeyboardKey keyboardKey="X" />
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><BackwardIcon /></div>
            </td>
            <td>
              <div className="action">Backward</div>
            </td>
            <td>
              <div className="key-wrapper">
                <KeyboardKey keyboardKey="A" />
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><PlayIcon /><span className="separator">|</span><PauseIcon /></div>
            </td>
            <td>
              <div className="action">Play | Pause</div>
            </td>
            <td>
              <div className="key-wrapper">
                <KeyboardKey keyboardKey="S" />
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><ForwardIcon /></div>
            </td>
            <td>
              <div className="action">Forward</div>
            </td>
            <td>
              <div className="key-wrapper">
                <KeyboardKey keyboardKey="D" />
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><RepeatIcon /></div>
            </td>
            <td>
              <div className="action">Loop</div>
            </td>
            <td>
              <div className="key-wrapper">
                /
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><NativeControlsIcon /></div>
            </td>
            <td>
              <div className="action">Native controls</div>
            </td>
            <td>
              <div className="key-wrapper">
                /
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><PictureInPictureIcon /></div>
            </td>
            <td>
              <div className="action">Picture-in-Picture</div>
            </td>
            <td>
              <div className="key-wrapper">
                <KeyboardKey keyboardKey="P" />
              </div>
            </td>
          </tr>
          <tr className="row-gap" />
          <tr>
            <td>
              <div className="icon"><RemoveIcon /></div>
            </td>
            <td>
              <div className="action">Disable</div>
            </td>
            <td>
              <div className="key-wrapper">
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

const KeyboardKey = ({ keyboardKey }: { keyboardKey: string }) => {
  return <div className="keyboard-key">{keyboardKey}</div>
}
