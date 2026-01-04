"use client"

import { useEffect } from "react"
import { useUIStore } from "@/src/stores/uiStore"

/**
 * Client-side component to initialize dark/light mode from localStorage
 * This ensures SSR and client render match initially, then syncs after hydration
 * Also adds 'hydrated' class to reveal content once initialization is complete
 */
export default function DarkModeInitializer() {
  const initialize = useUIStore((state) => state.initialize)
  const isHydrated = useUIStore((state) => state.isHydrated)

  useEffect(() => {
    if (!isHydrated) {
      initialize()
    }
  }, [initialize, isHydrated])

  useEffect(() => {
    if (isHydrated && typeof document !== "undefined") {
      document.documentElement.classList.add("hydrated")
    }
  }, [isHydrated])

  return null
}
