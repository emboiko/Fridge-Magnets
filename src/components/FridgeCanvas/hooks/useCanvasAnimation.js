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
import { drawMagnet, isMagnetVisible, calculateDistanceSquared } from "../utils.js"

// Hook to manage canvas animation loop
export function useCanvasAnimation(
  canvasRef,
  magnetsRef,
  draggingIndexRef,
  getSortedMagnets,
  getViewportBounds,
  imageCacheRef,
  animationStateRef,
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

        // All magnets in magnetsToDraw are visible (or being dragged)
        const isVisible = true

        const interpolatedPos = interpolated.get(index)
        if (interpolatedPos) {
          // Calculate how far we need to move: difference between where we are and where we want to be
          const dx = interpolatedPos.targetX - interpolatedPos.x
          const dy = interpolatedPos.targetY - interpolatedPos.y
          // Check distance squared (faster than calculating actual distance - we just need to compare)
          // Like asking "are we far enough away?" without doing the square root math
          const distanceSquared = dx * dx + dy * dy

          if (distanceSquared > INTERPOLATION_DISTANCE_THRESHOLD_SQUARED) {
            // Move a little bit toward the target each frame (smooth animation)
            // Instead of jumping instantly, we move 30% of the way there each time
            interpolatedPos.x += dx * INTERPOLATION_SPEED
            interpolatedPos.y += dy * INTERPOLATION_SPEED
            const interpolatedMagnet = {
              ...magnet,
              x: interpolatedPos.x,
              y: interpolatedPos.y,
            }
            drawMagnet(
              ctx,
              interpolatedMagnet,
              imageCacheRef.current,
              animationStateRef.current,
              isDarkMode,
              showDebug,
              isVisible
            )
          } else {
            interpolatedPos.x = interpolatedPos.targetX
            interpolatedPos.y = interpolatedPos.targetY
            interpolated.delete(index)
            drawMagnet(
              ctx,
              magnet,
              imageCacheRef.current,
              animationStateRef.current,
              isDarkMode,
              showDebug,
              isVisible
            )
          }
        } else {
          drawMagnet(
            ctx,
            magnet,
            imageCacheRef.current,
            animationStateRef.current,
            isDarkMode,
            showDebug,
            isVisible
          )
        }
      })

      if (currentDraggingIndex !== null && currentMagnets[currentDraggingIndex]) {
        // Dragged magnets are always visible
        drawMagnet(
          ctx,
          currentMagnets[currentDraggingIndex],
          imageCacheRef.current,
          animationStateRef.current,
          isDarkMode,
          showDebug,
          true
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
            ctx.font = `${ADMIN_MOVEMENT_LABEL_FONT_SIZE}px Raleway, sans-serif`
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
    animationStateRef,
    interpolatedPositionsRef,
    sortedMagnetsCacheRef,
    sortedMagnetsCacheTimeRef,
    activeMovementsRef,
  ])
}
