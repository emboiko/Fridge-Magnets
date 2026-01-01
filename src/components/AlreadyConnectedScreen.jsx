"use client"

import { useUIStore } from "@/src/stores/uiStore"

export default function AlreadyConnectedScreen() {
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  return (
    <div className="not-found-page">
      <div id="notfound">
        <p id="awkward">You ended up here because this IP address is</p>
        <p className="portal-blue">Already</p>
        <p className="portal-orange">Connected</p>
        <p className="not-found-description">
          You already have an active connection from this IP address. This might be from another
          browser tab or window. Please close other Fridge Magnets tabs and refresh this page.
        </p>
      </div>
      <img
        src="/img/not_found.svg"
        alt="Already Connected"
        className="not-found-svg"
        style={{
          filter: isDarkMode ? "invert(1)" : "invert(0)",
        }}
      />
    </div>
  )
}
