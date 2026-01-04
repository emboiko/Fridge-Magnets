"use client"

import { useEffect, useState } from "react"

export default function BannedScreen() {
  const [banReason, setBanReason] = useState(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reason = sessionStorage.getItem("banReason")
      if (reason) {
        setBanReason(reason)
        sessionStorage.removeItem("banReason")
      }
    }
  }, [])

  return (
    <div className="status-screen-page">
      <div id="status-screen-content">
        <p id="awkward">Due to your misbehavior, you've been</p>
        <p className="portal-blue">Banned</p>
        <p className="portal-orange">Permanently</p>
        {banReason && <p className="kicked-message">({banReason})</p>}
        <p className="kicked-description">
          You have been permanently banned from the server. This ban will remain in effect until an
          administrator removes it.
        </p>
        <img src="/img/screens/banned_1.svg" alt="Banned" className="banned-man-svg-1" />
        <img src="/img/screens/banned_2.svg" alt="Banned" className="banned-man-svg-2" />
      </div>
    </div>
  )
}
