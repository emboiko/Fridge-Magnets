"use client"

import { useEffect } from "react"
import { useUIStore } from "@/src/stores/uiStore"

export default function MobileInitializer() {
  useEffect(() => {
    const checkMobile = useUIStore.getState().checkMobile
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  useEffect(() => {
    const checkMobile = useUIStore.getState().checkMobile
    checkMobile()
  }, [])

  return null
}
