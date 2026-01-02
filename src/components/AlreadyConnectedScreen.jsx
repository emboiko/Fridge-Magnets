"use client"

import { useUIStore } from "@/src/stores/uiStore"

export default function AlreadyConnectedScreen() {
  const isDarkMode = useUIStore((state) => state.isDarkMode)

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
          src="/img/already_connected_1.svg"
          alt="Already Connected Man 1"
          className="already-connected-man-1-svg"
          style={{
            filter: isDarkMode ? "invert(1)" : "invert(0)",
          }}
        />
        <img
          src="/img/already_connected_2.svg"
          alt="Already Connected Man 2"
          className="already-connected-man-2-svg"
          style={{
            filter: isDarkMode ? "invert(1)" : "invert(0)",
          }}
        />
      </div>
    </div>
  )
}
