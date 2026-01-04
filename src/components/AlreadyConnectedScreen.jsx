"use client"

export default function AlreadyConnectedScreen() {
  return (
    <div className="status-screen-page">
      <div id="status-screen-content">
        <p id="awkward">You've ended up here because this IP address is</p>
        <p className="portal-blue">Already</p>
        <p className="portal-orange">Connected</p>
        <p className="not-found-description">
          You already have an active connection from this IP address. This might be from another
          browser tab or window. Please close other Fridge Magnets tabs and refresh this page.
        </p>
        <img
          src="/img/screens/already_connected_1.svg"
          alt="Already Connected Man 1"
          className="already-connected-man-1-svg"
        />
        <img
          src="/img/screens/already_connected_2.svg"
          alt="Already Connected Man 2"
          className="already-connected-man-2-svg"
        />
      </div>
    </div>
  )
}
