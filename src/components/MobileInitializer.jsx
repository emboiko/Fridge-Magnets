"use client"

import { useEffect } from "react"
import { useUIStore } from "@/src/stores/uiStore"

export default function MobileInitializer() {
  useEffect(() => {
    const checkMobile = useUIStore.getState().checkMobile
    const checkSmallMobile = useUIStore.getState().checkSmallMobile

    const handleResize = () => {
      checkMobile()
      checkSmallMobile()
    }

    checkMobile()
    checkSmallMobile()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    const checkMobile = useUIStore.getState().checkMobile
    const checkSmallMobile = useUIStore.getState().checkSmallMobile
    checkMobile()
    checkSmallMobile()
  }, [])

  return null
}
