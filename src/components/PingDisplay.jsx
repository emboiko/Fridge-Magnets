"use client"

import { usePingMeasurement } from "@/src/hooks/usePingMeasurement"
import { useUIStore } from "@/src/stores/uiStore"

export default function PingDisplay() {
  const isPingDisplayVisible = useUIStore((state) => state.isPingDisplayVisible)
  const ping = usePingMeasurement()

  if (!isPingDisplayVisible) {
    return null
  }

  return <div className="ping-display">{ping !== null ? `${Math.round(ping)}ms` : "---"}</div>
}
