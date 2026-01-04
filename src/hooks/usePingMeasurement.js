import { useEffect, useRef, useState } from "react"
import { useSocket } from "@/src/hooks/useSocket"

// Hook that continuously measures ping/latency regardless of UI visibility
// This ensures ping data is always available for the admin panel
// Returns the current ping value in milliseconds, or null if not yet measured
export function usePingMeasurement() {
  const socket = useSocket()
  const intervalRef = useRef(null)
  const [ping, setPing] = useState(null)

  useEffect(() => {
    if (!socket) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setPing(null)
      return
    }

    const measurePing = () => {
      const timestamp = Date.now()
      socket.emit("ping", { timestamp })
    }

    const handlePong = (data) => {
      if (data?.timestamp) {
        const latency = Date.now() - data.timestamp
        setPing(latency)
        socket.emit("pingMeasurement", { latency })
      }
    }

    socket.on("pong", handlePong)

    measurePing()
    intervalRef.current = setInterval(measurePing, 1000)

    return () => {
      socket.off("pong", handlePong)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [socket])

  return ping
}
