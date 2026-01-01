import { useEffect } from "react"
import {
  RECENTLY_DRAGGED_TIMEOUT_MS,
  RECENTLY_DRAGGED_CLEANUP_MULTIPLIER,
  CLEANUP_INTERVAL_MS,
} from "@/src/lib/constants.js"

/**
 * Hook to manage cleanup intervals for canvas state
 */
export function useCanvasCleanup(
  recentlyDraggedRef,
  interpolatedPositionsRef,
  magnetsRef,
  lastSentPositionRef
) {
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const recentlyDragged = recentlyDraggedRef.current

      for (const [index, timestamp] of recentlyDragged.entries()) {
        if (now - timestamp > RECENTLY_DRAGGED_TIMEOUT_MS * RECENTLY_DRAGGED_CLEANUP_MULTIPLIER) {
          recentlyDragged.delete(index)
        }
      }

      const interpolated = interpolatedPositionsRef.current
      const currentMagnets = magnetsRef.current
      for (const [index] of interpolated.entries()) {
        if (index >= currentMagnets.length) {
          interpolated.delete(index)
        }
      }

      const lastSent = lastSentPositionRef.current
      for (const [index, position] of lastSent.entries()) {
        if (
          index >= currentMagnets.length ||
          now - position.timestamp >
            RECENTLY_DRAGGED_TIMEOUT_MS * RECENTLY_DRAGGED_CLEANUP_MULTIPLIER
        ) {
          lastSent.delete(index)
        }
      }
    }, CLEANUP_INTERVAL_MS)

    return () => clearInterval(cleanupInterval)
  }, [recentlyDraggedRef, interpolatedPositionsRef, magnetsRef, lastSentPositionRef])
}
