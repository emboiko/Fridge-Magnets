import { useEffect } from "react"
import { magnetsArraySchema, magnetUpdateEventSchema } from "@/src/lib/validation/socketSchemas.js"
import { RECENTLY_DRAGGED_TIMEOUT_MS } from "@/src/lib/constants.js"

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
  hasCalledHomeRef,
  isResettingRef,
  fallingMagnetsRef,
  newMagnetsRef,
  resetAnimationStartTimeRef
) {
  useEffect(() => {
    if (!socket) {
      return
    }

    const handleFridgeReset = () => {
      const currentMagnets = magnetsRef.current

      if (currentMagnets.length === 0) {
        return
      }

      isResettingRef.current = true
      fallingMagnetsRef.current.clear()
      newMagnetsRef.current = []

      currentMagnets.forEach((magnet, index) => {
        fallingMagnetsRef.current.set(index, { ...magnet })
      })

      const interpolated = interpolatedPositionsRef.current
      interpolated.clear()
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

      if (isResettingRef.current) {
        newMagnetsRef.current = initialMagnets
      } else {
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
      }

      // Only call home() on the initial load, not on fridge reset events
      if (!hasCalledHomeRef.current) {
        home()
        hasCalledHomeRef.current = true
      }
    }

    const handleUpdate = (data) => {
      const validationResult = magnetUpdateEventSchema.safeParse(data)
      if (!validationResult.success) {
        console.error("Invalid update data received:", validationResult.error)
        return
      }

      if (validationResult.data.type !== "differential") {
        console.error("Unexpected update type:", validationResult.data.type)
        return
      }

      const changes = validationResult.data.changes
      const isResetting = isResettingRef.current

      const currentDraggingIndex = draggingIndexRef.current
      const now = Date.now()
      const updatesToApply = []

      changes.forEach(({ index, magnet }) => {
        if (currentDraggingIndex === index) {
          return
        }

        const recentlyDraggedTime = recentlyDraggedRef.current.get(index)
        if (recentlyDraggedTime && now - recentlyDraggedTime < RECENTLY_DRAGGED_TIMEOUT_MS) {
          return
        }

        if (isResetting) {
          const newMagnets = newMagnetsRef.current
          if (newMagnets && index >= 0 && index < newMagnets.length) {
            newMagnets[index] = { ...newMagnets[index], x: magnet.x, y: magnet.y }
          }
        } else {
          const currentMagnet = magnetsRef.current[index]
          if (!currentMagnet) {
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
        }
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

    socket.on("fridgeReset", handleFridgeReset)
    socket.on("welcome", handleWelcome)
    socket.on("update", handleUpdate)
    socket.on("error", handleError)
    socket.on("magnetMovementUpdate", handleMagnetMovementUpdate)

    return () => {
      socket.off("fridgeReset", handleFridgeReset)
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
    isResettingRef,
    fallingMagnetsRef,
    newMagnetsRef,
    resetAnimationStartTimeRef,
  ])
}
