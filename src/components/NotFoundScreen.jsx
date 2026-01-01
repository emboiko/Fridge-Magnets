"use client"

import { useUIStore } from "@/src/stores/uiStore"

export default function NotFound() {
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  return (
    <div className="not-found-page">
      <div id="notfound">
        <p id="awkward">This is awkward for all of us.</p>
        <p className="portal-blue">404</p>
        <p className="portal-orange">Not Found</p>
      </div>
      <img
        src="/img/not_found.svg"
        alt="Not Found"
        className="not-found-svg"
        style={{
          filter: isDarkMode ? "invert(1)" : "invert(0)",
        }}
      />
    </div>
  )
}
