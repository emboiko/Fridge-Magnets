"use client"

import { useEffect, useState } from "react"
import { useUIStore } from "@/src/stores/uiStore"

export default function BannedScreen() {
  const [banReason, setBanReason] = useState(null)
  const isMobile = useUIStore((state) => state.isMobile)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reason = sessionStorage.getItem("banReason")
      if (reason) {
        setBanReason(reason)
        sessionStorage.removeItem("banReason")
      }
    }
  }, [])

  const fingerImageSrc = isMobile
    ? "/img/screens/banned_finger_up.svg"
    : "/img/screens/banned_finger_right.svg"

  return (
    <div className="status-screen-page">
      <div id="status-screen-content">
        <img src="/img/screens/banned_man.svg" alt="Banned" className="banned-man-svg-1" />
        <p id="awkward">Due to your misbehavior, you've been</p>
        <p className="portal-blue">Banned</p>
        <p className="portal-orange">Permanently</p>
        {banReason && <p className="kicked-message">({banReason})</p>}
        <p className="kicked-description">
          You have been permanently banned from the server. This ban will remain in effect until an
          administrator removes it.
        </p>
        <img src={fingerImageSrc} alt="Banned" className="banned-man-svg-2" />
      </div>
    </div>
  )
}
