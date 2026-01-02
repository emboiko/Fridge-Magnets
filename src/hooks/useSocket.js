/**
 * Socket.IO Hook
 *
 * Learning Notes:
 * - Custom hook for managing Socket.IO connection
 * - Uses singleton pattern to ensure only ONE socket connection exists
 * - All components share the same socket instance
 * - Automatically cleans up on page unload
 * - Handles "already connected" errors and redirects
 * - Supports test IP override in development mode via query parameter
 * - Returns socket instance for use in components
 */

"use client"

import { useEffect, useState } from "react"
import { io } from "socket.io-client"

// Singleton socket instance - shared across all components
let socketInstance = null

const getSocket = () => {
  if (typeof window === "undefined") {
    return null
  }

  if (!socketInstance) {
    // Use NEXT_PUBLIC_APP_URL if set, otherwise fall back to current origin
    // Normalize URL (remove trailing slash, ensure protocol)
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    const fallbackUrl = window.location.origin
    const socketUrl = envUrl || fallbackUrl

    // Get test IP from URL query parameter (development only)
    const urlParams = new URLSearchParams(window.location.search)
    const testIP = urlParams.get("testIP")

    const socketOptions = {
      transports: ["websocket"],
    }

    // In development, pass test IP in handshake auth
    if (testIP && process.env.NODE_ENV !== "production") {
      socketOptions.auth = {
        testIP: testIP,
      }
    }

    socketInstance = io(socketUrl, socketOptions)

    // Add connection event listeners for debugging
    socketInstance.on("connect", () => {
      console.info("Socket.IO connected, socket ID:", socketInstance.id)
      if (testIP) {
        console.info(`[DEV] Using test IP: ${testIP}`)
      }
    })

    socketInstance.on("disconnect", () => {
      console.info("Socket.IO disconnected")
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error)
      console.error("Connection URL:", socketUrl)
      console.error("Current origin:", window.location.origin)
      console.error("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "not set")
    })

    // Handle error events (including already connected and kicked)
    socketInstance.on("error", (data) => {
      if (data.code === "ALREADY_CONNECTED" || data.message === "already_connected") {
        // Redirect to already connected page
        if (typeof window !== "undefined") {
          window.location.href = "/already-connected"
        }
      } else if (data.code === "KICKED") {
        // Store kick message in sessionStorage for display on kicked page
        if (typeof window !== "undefined") {
          if (data.message) {
            sessionStorage.setItem("kickMessage", data.message)
          }
          window.location.href = "/kicked"
        }
      } else if (data.code === "BANNED") {
        // Store ban message/reason in sessionStorage for display on banned page
        if (typeof window !== "undefined") {
          if (data.reason) {
            sessionStorage.setItem("banReason", data.reason)
          } else if (data.message) {
            sessionStorage.setItem("banReason", data.message)
          }
          window.location.href = "/banned"
        }
      }
    })

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
    })
  }

  return socketInstance
}

export const useSocket = () => {
  const [socket, setSocket] = useState(() => getSocket())

  useEffect(() => {
    const currentSocket = getSocket()
    setSocket(currentSocket)
    // Don't disconnect on unmount - keep the singleton alive
    // It will be cleaned up on page unload
  }, [])

  return socket
}
