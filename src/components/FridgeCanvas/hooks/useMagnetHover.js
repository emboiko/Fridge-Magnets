import { useState, useEffect, useRef, useCallback } from "react"
import { EMIT_THROTTLE_MS } from "@/src/lib/constants.js"

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
      if (now - lastHoverCheckRef.current < EMIT_THROTTLE_MS) {
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
