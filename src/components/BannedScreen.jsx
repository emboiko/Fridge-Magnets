"use client"

import { useEffect, useState } from "react"
import { useUIStore } from "@/src/stores/uiStore"

export default function BannedScreen() {
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const [banReason, setBanReason] = useState(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reason = sessionStorage.getItem("banReason")
      if (reason) {
        setBanReason(reason)
        // Clear it after reading
        sessionStorage.removeItem("banReason")
      }
    }
  }, [])

  return (
    <div className="not-found-page">
      <div id="notfound">
        <p id="awkward">Due to your misbehavior, you've been</p>
        <p className="portal-blue">Banned</p>
        <p className="portal-orange">Permanently</p>
        {banReason && <p className="kicked-message">({banReason})</p>}
        <p className="kicked-description">
          You have been permanently banned from the server. This ban will remain in effect until an
          administrator removes it.
        </p>
      </div>
      <img
        src="/img/not_found.svg"
        alt="Banned"
        className="not-found-svg"
        style={{
          filter: isDarkMode ? "invert(1)" : "invert(0)",
        }}
      />
    </div>
  )
}
