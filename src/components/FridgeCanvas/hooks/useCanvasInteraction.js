import { useCallback } from "react"
import { CANVAS_WIDTH, CANVAS_HEIGHT, EMIT_THROTTLE_MS } from "@/src/lib/constants.js"

// Hook to handle canvas pointer interactions (dragging and panning)
export function useCanvasInteraction(
  containerRef,
  getCanvasCoordinates,
  findClickedMagnet,
  magnetsRef,
  interpolatedPositionsRef,
  setDraggingIndex,
  setIsPanning,
  setPanStart,
  panStartScrollRef,
  isPanning,
  panStart,
  socket,
  draggingIndexRef,
  updateMagnetByIndex,
  markMagnetInteracted,
  sortedMagnetsCacheRef,
  lastEmitTimeRef,
  lastSentPositionRef,
  recentlyDraggedRef
) {
  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault()
      const coords = getCanvasCoordinates(e.clientX, e.clientY)
      if (!coords) return

      const clickedIndex = findClickedMagnet(coords.x, coords.y)

      if (clickedIndex !== null) {
        const currentMagnet = magnetsRef.current[clickedIndex]
        if (currentMagnet) {
          const interpolated = interpolatedPositionsRef.current.get(clickedIndex)
          if (interpolated) {
            interpolated.x = currentMagnet.x
            interpolated.y = currentMagnet.y
            interpolated.targetX = currentMagnet.x
            interpolated.targetY = currentMagnet.y
          } else {
            interpolatedPositionsRef.current.set(clickedIndex, {
              x: currentMagnet.x,
              y: currentMagnet.y,
              targetX: currentMagnet.x,
              targetY: currentMagnet.y,
            })
          }
        }
        setDraggingIndex(clickedIndex)
      } else {
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        const container = containerRef.current
        if (container) {
          panStartScrollRef.current = {
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
          }
        }
      }
    },
    [
      getCanvasCoordinates,
      findClickedMagnet,
      setDraggingIndex,
      magnetsRef,
      interpolatedPositionsRef,
      setIsPanning,
      setPanStart,
      panStartScrollRef,
    ]
  )

  const handlePointerMove = useCallback(
    (e) => {
      const currentDraggingIndex = draggingIndexRef.current

      if (currentDraggingIndex !== null) {
        const coords = getCanvasCoordinates(e.clientX, e.clientY)
        if (!coords) return

        const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, coords.x))
        const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, coords.y))
        updateMagnetByIndex(currentDraggingIndex, { x: clampedX, y: clampedY })
        markMagnetInteracted(currentDraggingIndex)
        sortedMagnetsCacheRef.current = null

        const interpolated = interpolatedPositionsRef.current.get(currentDraggingIndex)
        if (interpolated) {
          interpolated.x = clampedX
          interpolated.y = clampedY
          interpolated.targetX = clampedX
          interpolated.targetY = clampedY
        }

        const now = Date.now()
        if (socket && now - lastEmitTimeRef.current >= EMIT_THROTTLE_MS) {
          socket.emit("magnetMove", {
            x: clampedX,
            y: clampedY,
            magnetIndex: currentDraggingIndex,
          })
          lastSentPositionRef.current.set(currentDraggingIndex, {
            x: clampedX,
            y: clampedY,
            timestamp: now,
          })
          lastEmitTimeRef.current = now
        }
      } else if (isPanning) {
        const container = containerRef.current
        if (container) {
          const deltaX = panStart.x - e.clientX
          const deltaY = panStart.y - e.clientY
          container.scrollTo({
            left: panStartScrollRef.current.scrollLeft + deltaX,
            top: panStartScrollRef.current.scrollTop + deltaY,
          })
        }
      }
    },
    [
      isPanning,
      panStart,
      socket,
      getCanvasCoordinates,
      updateMagnetByIndex,
      markMagnetInteracted,
      draggingIndexRef,
      lastEmitTimeRef,
      lastSentPositionRef,
      sortedMagnetsCacheRef,
      interpolatedPositionsRef,
    ]
  )

  const handlePointerUp = useCallback(() => {
    const currentDraggingIndex = draggingIndexRef.current
    if (currentDraggingIndex !== null && socket && magnetsRef.current[currentDraggingIndex]) {
      const magnet = magnetsRef.current[currentDraggingIndex]
      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, magnet.x))
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, magnet.y))
      const now = Date.now()
      socket.emit("magnetMove", {
        x: clampedX,
        y: clampedY,
        magnetIndex: currentDraggingIndex,
      })
      markMagnetInteracted(currentDraggingIndex)
      recentlyDraggedRef.current.set(currentDraggingIndex, now)
      lastSentPositionRef.current.set(currentDraggingIndex, {
        x: clampedX,
        y: clampedY,
        timestamp: now,
      })
      sortedMagnetsCacheRef.current = null

      const interpolated = interpolatedPositionsRef.current.get(currentDraggingIndex)
      if (interpolated) {
        interpolated.x = clampedX
        interpolated.y = clampedY
        interpolated.targetX = clampedX
        interpolated.targetY = clampedY
      }
    }
    setDraggingIndex(null)
    setIsPanning(false)
  }, [
    socket,
    setDraggingIndex,
    markMagnetInteracted,
    magnetsRef,
    recentlyDraggedRef,
    lastSentPositionRef,
    sortedMagnetsCacheRef,
    interpolatedPositionsRef,
    setIsPanning,
  ])

  const handlePointerCancel = useCallback(() => {
    const currentDraggingIndex = draggingIndexRef.current
    if (currentDraggingIndex !== null && socket && magnetsRef.current[currentDraggingIndex]) {
      const magnet = magnetsRef.current[currentDraggingIndex]
      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, magnet.x))
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, magnet.y))
      const now = Date.now()
      socket.emit("magnetMove", {
        x: clampedX,
        y: clampedY,
        magnetIndex: currentDraggingIndex,
      })
      markMagnetInteracted(currentDraggingIndex)
      recentlyDraggedRef.current.set(currentDraggingIndex, now)
      lastSentPositionRef.current.set(currentDraggingIndex, {
        x: clampedX,
        y: clampedY,
        timestamp: now,
      })
      sortedMagnetsCacheRef.current = null

      const interpolated = interpolatedPositionsRef.current.get(currentDraggingIndex)
      if (interpolated) {
        interpolated.x = clampedX
        interpolated.y = clampedY
        interpolated.targetX = clampedX
        interpolated.targetY = clampedY
      }
    }
    setDraggingIndex(null)
    setIsPanning(false)
  }, [
    socket,
    setDraggingIndex,
    markMagnetInteracted,
    magnetsRef,
    recentlyDraggedRef,
    lastSentPositionRef,
    sortedMagnetsCacheRef,
    interpolatedPositionsRef,
    setIsPanning,
  ])

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  }
}
