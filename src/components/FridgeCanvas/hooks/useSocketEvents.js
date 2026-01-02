import { useEffect } from "react"
import { magnetsArraySchema } from "@/src/lib/validation/socketSchemas.js"
import { RECENTLY_DRAGGED_TIMEOUT_MS, POSITION_MATCH_THRESHOLD } from "@/src/lib/constants.js"

/**
 * Hook to handle socket events (welcome, update, error, magnetMovementUpdate)
 */
export function useSocketEvents(
  socket,
  initializeMagnets,
  updateMagnetByIndex,
  markMagnetInteracted,
  home,
  draggingIndexRef,
  magnetsRef,
  recentlyDraggedRef,
  lastSentPositionRef,
  interpolatedPositionsRef,
  sortedMagnetsCacheRef,
  activeMovementsRef,
  hasCalledHomeRef
) {
  useEffect(() => {
    if (!socket) {
      return
    }

    const handleWelcome = (data) => {
      const validationResult = magnetsArraySchema.safeParse(data)
      if (!validationResult.success) {
        console.error("Invalid welcome data received:", validationResult.error)
        socket.emit("error", { message: "Invalid data received from server" })
        return
      }

      const initialMagnets = validationResult.data
      console.info("Received welcome event with", initialMagnets.length, "magnets")
      initializeMagnets(initialMagnets)

      const interpolated = interpolatedPositionsRef.current
      interpolated.clear()
      initialMagnets.forEach((magnet, index) => {
        interpolated.set(index, {
          x: magnet.x,
          y: magnet.y,
          targetX: magnet.x,
          targetY: magnet.y,
        })
      })

      // Only call home() on the initial load, not on resets
      if (!hasCalledHomeRef.current) {
        home()
        hasCalledHomeRef.current = true
      }
    }

    const handleUpdate = (data) => {
      const validationResult = magnetsArraySchema.safeParse(data)
      if (!validationResult.success) {
        console.error("Invalid update data received:", validationResult.error)
        return
      }

      const currentDraggingIndex = draggingIndexRef.current
      const updatedMagnets = validationResult.data
      const now = Date.now()

      const updatesToApply = []

      updatedMagnets.forEach((magnet, index) => {
        if (currentDraggingIndex === index) {
          return
        }

        const recentlyDraggedTime = recentlyDraggedRef.current.get(index)
        if (recentlyDraggedTime && now - recentlyDraggedTime < RECENTLY_DRAGGED_TIMEOUT_MS) {
          const lastSent = lastSentPositionRef.current.get(index)
          if (lastSent) {
            // Calculate how far the magnet moved using distance formula (Pythagorean theorem)
            // Like measuring the straight-line distance between two points on a map
            const distanceFromSent = Math.sqrt(
              Math.pow(magnet.x - lastSent.x, 2) + Math.pow(magnet.y - lastSent.y, 2)
            )
            if (distanceFromSent > POSITION_MATCH_THRESHOLD) {
              return
            }
          } else {
            return
          }
        }

        const currentMagnet = magnetsRef.current[index]
        if (!currentMagnet) {
          return
        }

        // Calculate how far the new position is from where we currently see the magnet
        // This tells us if the magnet actually moved enough to care about
        // TODO: Unsure if we actually need this, but it's here for now. May deprecate later.
        const distanceFromCurrent = Math.sqrt(
          Math.pow(magnet.x - currentMagnet.x, 2) + Math.pow(magnet.y - currentMagnet.y, 2)
        )

        if (distanceFromCurrent < POSITION_MATCH_THRESHOLD) {
          return
        }

        const interpolated = interpolatedPositionsRef.current.get(index)
        const currentX = currentMagnet.x
        const currentY = currentMagnet.y

        if (interpolated) {
          interpolated.targetX = magnet.x
          interpolated.targetY = magnet.y
        } else {
          interpolatedPositionsRef.current.set(index, {
            x: currentX,
            y: currentY,
            targetX: magnet.x,
            targetY: magnet.y,
          })
        }

        updatesToApply.push({ index, x: magnet.x, y: magnet.y })
      })

      if (updatesToApply.length > 0) {
        updatesToApply.forEach(({ index, x, y }) => {
          updateMagnetByIndex(index, { x, y })
          markMagnetInteracted(index)
        })
        sortedMagnetsCacheRef.current = null
      }
    }

    const handleError = (data) => {
      if (typeof data === "object" && data !== null && "message" in data) {
        console.warn("Server error:", data.message)
      } else {
        console.warn("Unknown server error:", data)
      }
    }

    // Admin - Who's moving what:
    // Server only sends this to admin sockets, so if we receive it, we can process it
    const handleMagnetMovementUpdate = (data) => {
      const movementsMap = new Map()
      if (data.movements && data.movements.length > 0) {
        data.movements.forEach((movement) => {
          movementsMap.set(movement.socketId, {
            magnetIndex: movement.magnetIndex,
            username: movement.username,
          })
        })
      }
      activeMovementsRef.current = movementsMap
    }

    socket.on("welcome", handleWelcome)
    socket.on("update", handleUpdate)
    socket.on("error", handleError)
    socket.on("magnetMovementUpdate", handleMagnetMovementUpdate)

    return () => {
      socket.off("welcome", handleWelcome)
      socket.off("update", handleUpdate)
      socket.off("error", handleError)
      socket.off("magnetMovementUpdate", handleMagnetMovementUpdate)
    }
  }, [
    socket,
    initializeMagnets,
    updateMagnetByIndex,
    markMagnetInteracted,
    home,
    draggingIndexRef,
    magnetsRef,
    recentlyDraggedRef,
    lastSentPositionRef,
    interpolatedPositionsRef,
    sortedMagnetsCacheRef,
    activeMovementsRef,
    hasCalledHomeRef,
  ])
}
