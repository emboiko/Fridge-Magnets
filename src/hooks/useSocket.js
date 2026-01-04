// Custom hook for managing Socket.IO connection using a singleton pattern.
// All components share the same socket instance, which is automatically
// cleaned up on page unload. Handles connection errors, redirects for
// "already connected" and "kicked" states, and supports test IP override
// in development mode via query parameter.

"use client"

import { useEffect, useState } from "react"
import { io } from "socket.io-client"

let socketInstance = null

const getSocket = () => {
  if (typeof window === "undefined") {
    return null
  }

  if (!socketInstance) {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    const fallbackUrl = window.location.origin
    const socketUrl = envUrl || fallbackUrl

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

    socketInstance.on("error", (data) => {
      if (data.code === "ALREADY_CONNECTED" || data.message === "already_connected") {
        if (typeof window !== "undefined") {
          window.location.href = "/already-connected"
        }
      } else if (data.code === "KICKED") {
        if (typeof window !== "undefined") {
          if (data.message) {
            sessionStorage.setItem("kickMessage", data.message)
          }
          window.location.href = "/kicked"
        }
      } else if (data.code === "BANNED") {
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
