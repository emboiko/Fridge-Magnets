"use client"

import { useEffect, useState } from "react"
import { useUIStore } from "@/src/stores/uiStore"

export default function KickedScreen() {
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const [kickMessage, setKickMessage] = useState(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const message = sessionStorage.getItem("kickMessage")
      if (message) {
        setKickMessage(message)
        sessionStorage.removeItem("kickMessage")
      }
    }
  }, [])

  return (
    <div className="status-screen-page">
      <div id="status-screen-content">
        <p id="awkward">Due to your misbehavior, you've been</p>
        <p className="portal-blue">Kicked</p>
        <p className="portal-orange">Temporarily</p>
        {kickMessage && <p className="kicked-message">({kickMessage})</p>}
        <p className="kicked-description">
          You have been temporarily kicked from the server. Take this time to relfect on your
          naughty misconduct and come back later. Maybe consider using a VPN to hide your IP
          address, who knows?
        </p>
        <img
          src="/img/kicked_2.svg"
          alt="Kicked"
          className="kicked-man-1-svg"
          style={{
            filter: isDarkMode ? "invert(1)" : "invert(0)",
          }}
        />
        <img
          src="/img/kicked_1.svg"
          alt="Kicked"
          className="kicked-man-2-svg"
          style={{
            filter: isDarkMode ? "invert(1)" : "invert(0)",
          }}
        />
      </div>
    </div>
  )
}
