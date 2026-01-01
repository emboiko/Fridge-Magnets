"use client"

import { useEffect } from "react"
import { useUIStore } from "@/src/stores/uiStore"

/**
 * Client-side component to initialize dark/light mode from localStorage
 * This ensures SSR and client render match initially, then syncs after hydration
 */
export default function DarkModeInitializer() {
  const initialize = useUIStore((state) => state.initialize)
  const isHydrated = useUIStore((state) => state.isHydrated)

  useEffect(() => {
    if (!isHydrated) {
      initialize()
    }
  }, [initialize, isHydrated])

  return null
}
