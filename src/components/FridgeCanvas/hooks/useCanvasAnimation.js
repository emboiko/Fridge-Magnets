import { useEffect, useRef } from "react"
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INTERPOLATION_SPEED,
  INTERPOLATION_DISTANCE_THRESHOLD_SQUARED,
  SORTED_MAGNETS_CACHE_TTL_MS,
  ADMIN_MOVEMENT_LABEL_FONT_SIZE,
  ADMIN_MOVEMENT_LABEL_PADDING,
} from "@/src/lib/constants.js"
import { drawMagnet, isMagnetVisible } from "../utils.js"

/**
 * Hook to manage canvas animation loop
 */
export function useCanvasAnimation(
  canvasRef,
  magnetsRef,
  draggingIndexRef,
  getSortedMagnets,
  getViewportBounds,
  imageCacheRef,
  interpolatedPositionsRef,
  sortedMagnetsCacheRef,
  sortedMagnetsCacheTimeRef,
  activeMovementsRef,
  isDarkMode,
  showDebug,
  isAdminAuthenticated
) {
  const animationFrameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = () => {
      const currentMagnets = magnetsRef.current
      const currentDraggingIndex = draggingIndexRef.current
      const now = Date.now()

      if (
        !sortedMagnetsCacheRef.current ||
        now - sortedMagnetsCacheTimeRef.current > SORTED_MAGNETS_CACHE_TTL_MS
      ) {
        sortedMagnetsCacheRef.current = getSortedMagnets()
        sortedMagnetsCacheTimeRef.current = now
      }
      const sortedMagnets = sortedMagnetsCacheRef.current
      const interpolated = interpolatedPositionsRef.current

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const viewport = getViewportBounds()

      const magnetsToDraw = viewport
        ? sortedMagnets.filter(({ magnet, index }) => {
            if (index === currentDraggingIndex) {
              return true
            }
            return isMagnetVisible(magnet, viewport)
          })
        : sortedMagnets

      magnetsToDraw.forEach(({ magnet, index }) => {
        if (index === currentDraggingIndex) {
          return
        }

        const interpolatedPos = interpolated.get(index)
        if (interpolatedPos) {
          const dx = interpolatedPos.targetX - interpolatedPos.x
          const dy = interpolatedPos.targetY - interpolatedPos.y
          const distanceSquared = dx * dx + dy * dy

          if (distanceSquared > INTERPOLATION_DISTANCE_THRESHOLD_SQUARED) {
            interpolatedPos.x += dx * INTERPOLATION_SPEED
            interpolatedPos.y += dy * INTERPOLATION_SPEED
            const interpolatedMagnet = {
              ...magnet,
              x: interpolatedPos.x,
              y: interpolatedPos.y,
            }
            drawMagnet(ctx, interpolatedMagnet, imageCacheRef.current, isDarkMode, showDebug)
          } else {
            interpolatedPos.x = interpolatedPos.targetX
            interpolatedPos.y = interpolatedPos.targetY
            interpolated.delete(index)
            drawMagnet(ctx, magnet, imageCacheRef.current, isDarkMode, showDebug)
          }
        } else {
          drawMagnet(ctx, magnet, imageCacheRef.current, isDarkMode, showDebug)
        }
      })

      if (currentDraggingIndex !== null && currentMagnets[currentDraggingIndex]) {
        drawMagnet(
          ctx,
          currentMagnets[currentDraggingIndex],
          imageCacheRef.current,
          isDarkMode,
          showDebug
        )
      }

      // Draw movement labels (only for admins)
      if (isAdminAuthenticated) {
        const currentMovements = activeMovementsRef.current
        for (const [socketId, movement] of currentMovements.entries()) {
          const magnetIndex = movement.magnetIndex
          if (magnetIndex >= 0 && magnetIndex < currentMagnets.length) {
            const magnet = currentMagnets[magnetIndex]
            const interpolatedPos = interpolated.get(magnetIndex)
            const displayX = interpolatedPos ? interpolatedPos.x : magnet.x
            const displayY = interpolatedPos ? interpolatedPos.y : magnet.y

            const labelText = movement.username || socketId

            ctx.save()
            ctx.font = `${ADMIN_MOVEMENT_LABEL_FONT_SIZE}px Arial, sans-serif`
            ctx.textAlign = "center"
            ctx.textBaseline = "bottom"

            const textMetrics = ctx.measureText(labelText)
            const textWidth = textMetrics.width
            const textHeight = ADMIN_MOVEMENT_LABEL_FONT_SIZE

            const labelX = displayX
            const labelY = displayY - magnet.radius - ADMIN_MOVEMENT_LABEL_PADDING

            // Draw background
            ctx.fillStyle = isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)"
            ctx.fillRect(
              labelX - textWidth / 2 - ADMIN_MOVEMENT_LABEL_PADDING,
              labelY - textHeight - ADMIN_MOVEMENT_LABEL_PADDING,
              textWidth + ADMIN_MOVEMENT_LABEL_PADDING * 2,
              textHeight + ADMIN_MOVEMENT_LABEL_PADDING * 2
            )

            // Draw border
            ctx.strokeStyle = isDarkMode ? "#ffffff" : "#000000"
            ctx.lineWidth = 1
            ctx.strokeRect(
              labelX - textWidth / 2 - ADMIN_MOVEMENT_LABEL_PADDING,
              labelY - textHeight - ADMIN_MOVEMENT_LABEL_PADDING,
              textWidth + ADMIN_MOVEMENT_LABEL_PADDING * 2,
              textHeight + ADMIN_MOVEMENT_LABEL_PADDING * 2
            )

            // Draw text
            ctx.fillStyle = isDarkMode ? "#ffffff" : "#000000"
            ctx.fillText(labelText, labelX, labelY - ADMIN_MOVEMENT_LABEL_PADDING)

            ctx.restore()
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    getSortedMagnets,
    getViewportBounds,
    showDebug,
    isDarkMode,
    isAdminAuthenticated,
    magnetsRef,
    draggingIndexRef,
    imageCacheRef,
    interpolatedPositionsRef,
    sortedMagnetsCacheRef,
    sortedMagnetsCacheTimeRef,
    activeMovementsRef,
  ])
}
