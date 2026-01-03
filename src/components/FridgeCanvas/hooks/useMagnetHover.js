import { useState, useEffect, useRef, useCallback } from "react"

/**
 * Hook to detect when mouse is hovering over a magnet
 * Uses throttling to avoid performance issues
 */
export function useMagnetHover(
  canvasRef,
  getCanvasCoordinates,
  findClickedMagnet,
  draggingIndex,
  isPanning,
  isSelectingSummonCoordinates
) {
  const [isHoveringMagnet, setIsHoveringMagnet] = useState(false)
  const lastHoverCheckRef = useRef(0)
  const hoverCheckThrottleMs = 16 // ~60fps

  const handleMouseMove = useCallback(
    (e) => {
      // Don't check hover while dragging, panning, or selecting coordinates
      if (draggingIndex !== null || isPanning || isSelectingSummonCoordinates) {
        if (isHoveringMagnet) {
          setIsHoveringMagnet(false)
        }
        return
      }

      const now = Date.now()
      if (now - lastHoverCheckRef.current < hoverCheckThrottleMs) {
        return
      }
      lastHoverCheckRef.current = now

      const coords = getCanvasCoordinates(e.clientX, e.clientY)
      if (!coords) {
        if (isHoveringMagnet) {
          setIsHoveringMagnet(false)
        }
        return
      }

      const hoveredIndex = findClickedMagnet(coords.x, coords.y)
      const newIsHovering = hoveredIndex !== null

      if (newIsHovering !== isHoveringMagnet) {
        setIsHoveringMagnet(newIsHovering)
      }
    },
    [
      getCanvasCoordinates,
      findClickedMagnet,
      draggingIndex,
      isPanning,
      isSelectingSummonCoordinates,
      isHoveringMagnet,
    ]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    canvas.addEventListener("mousemove", handleMouseMove)

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
    }
  }, [canvasRef, handleMouseMove])

  // Reset hover state when dragging starts or stops
  useEffect(() => {
    if (draggingIndex !== null || isPanning || isSelectingSummonCoordinates) {
      setIsHoveringMagnet(false)
    }
  }, [draggingIndex, isPanning, isSelectingSummonCoordinates])

  return isHoveringMagnet
}
