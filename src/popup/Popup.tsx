import popupCss from "./popup.scss?inline"
import iconLarge from "../assets/img/icon-large.png"

export const Popup = () => {
  return (
    <>
      <style>{popupCss}</style>
      <div>Bee fast video</div>
      <div>
        <img
          src={iconLarge}
          alt="Bee holding a red play-video button." />
      </div>
    </>
  )
}
