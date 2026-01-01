/**
 * Fridge Canvas Component - Optimized for Smooth Dragging
 *
 * Performance Optimizations:
 * - Always animates during dragging (no conditional pause)
 * - Viewport culling for non-dragged magnets only
 * - Direct state updates during drag (minimal re-renders)
 * - Continuous animation loop (simpler, more reliable)
 */

"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useSocket } from "@/src/hooks/useSocket"
import { useMagnetStore } from "@/src/stores/magnetStore"
import { useUIStore } from "@/src/stores/uiStore"
import { useAdminStore } from "@/src/stores/adminStore"
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_PADDING } from "@/src/lib/constants.js"
import { useImageLoading } from "./hooks/useImageLoading.js"
import { useSocketEvents } from "./hooks/useSocketEvents.js"
import { useCanvasAnimation } from "./hooks/useCanvasAnimation.js"
import { useKeyboardControls } from "./hooks/useKeyboardControls.js"
import { useCanvasInteraction } from "./hooks/useCanvasInteraction.js"
import { useCanvasCleanup } from "./hooks/useCanvasCleanup.js"

export default function FridgeCanvas() {
  const isAdminAuthenticated = useAdminStore((state) => state.isAdminAuthenticated)
  const isAdminAuthModalOpen = useAdminStore((state) => state.isAdminAuthModalOpen)
  const openAdminAuthModal = useAdminStore((state) => state.openAdminAuthModal)
  const openAdminPanel = useAdminStore((state) => state.openAdminPanel)
  const closeAdminPanel = useAdminStore((state) => state.closeAdminPanel)
  const isChatOpen = useUIStore((state) => state.isChatOpen)
  const openChat = useUIStore((state) => state.openChat)
  const closeChat = useUIStore((state) => state.closeChat)
  const toggleHeader = useUIStore((state) => state.toggleHeader)
  const setShouldFocusChat = useUIStore((state) => state.setShouldFocusChat)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  const socket = useSocket()
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const {
    magnets,
    draggingIndex,
    initializeMagnets,
    updateMagnetByIndex,
    setDraggingIndex,
    markMagnetInteracted,
    getSortedMagnets,
  } = useMagnetStore()

  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showDebug, setShowDebug] = useState(false)
  const activeMovementsRef = useRef(new Map())
  const isAdminAuthenticatedRef = useRef(isAdminAuthenticated)
  const panStartScrollRef = useRef({ scrollLeft: 0, scrollTop: 0 })

  const lastEmitTimeRef = useRef(0)

  const draggingIndexRef = useRef(null)
  const magnetsRef = useRef([])
  const recentlyDraggedRef = useRef(new Map())
  const lastSentPositionRef = useRef(new Map())
  const sortedMagnetsCacheRef = useRef(null)
  const sortedMagnetsCacheTimeRef = useRef(0)

  const interpolatedPositionsRef = useRef(new Map())

  useEffect(() => {
    draggingIndexRef.current = draggingIndex
  }, [draggingIndex])

  useEffect(() => {
    magnetsRef.current = magnets
    sortedMagnetsCacheRef.current = null
  }, [magnets])

  const imageCacheRef = useImageLoading(magnets)

  const home = useCallback(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const scrollLeft = Math.max(0, CANVAS_WIDTH / 2 - container.clientWidth / 2)
    const scrollTop = Math.max(0, CANVAS_HEIGHT / 2 - container.clientHeight / 2)
    container.scrollTo({
      top: scrollTop,
      left: scrollLeft,
      behavior: "smooth",
    })
  }, [])

  useEffect(() => {
    isAdminAuthenticatedRef.current = isAdminAuthenticated
    if (!isAdminAuthenticated) {
      activeMovementsRef.current.clear()
    }
  }, [isAdminAuthenticated])

  const hasCalledHomeRef = useRef(false)

  const getCanvasCoordinates = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const getViewportBounds = useCallback(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const scrollLeft = container.scrollLeft
    const scrollTop = container.scrollTop

    return {
      left: scrollLeft * scaleX - CANVAS_PADDING,
      top: scrollTop * scaleY - CANVAS_PADDING,
      right: (scrollLeft + container.clientWidth) * scaleX + CANVAS_PADDING,
      bottom: (scrollTop + container.clientHeight) * scaleY + CANVAS_PADDING,
    }
  }, [])

  const findClickedMagnet = useCallback(
    (x, y) => {
      const sortedMagnets = getSortedMagnets()
      const interpolated = interpolatedPositionsRef.current

      for (let i = sortedMagnets.length - 1; i >= 0; i--) {
        const { magnet, index } = sortedMagnets[i]
        const interpolatedPos = interpolated.get(index)

        const checkX = interpolatedPos ? interpolatedPos.x : magnet.x
        const checkY = interpolatedPos ? interpolatedPos.y : magnet.y

        const distance = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2))
        if (distance <= magnet.radius) {
          return index
        }
      }

      return null
    },
    [getSortedMagnets]
  )

  useSocketEvents(
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
  )

  useCanvasAnimation(
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
  )

  useKeyboardControls(
    containerRef,
    isChatOpen,
    openChat,
    closeChat,
    toggleHeader,
    setShouldFocusChat,
    home,
    setShowDebug,
    isAdminAuthenticated,
    isAdminAuthModalOpen,
    openAdminAuthModal,
    openAdminPanel,
    closeAdminPanel
  )

  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } =
    useCanvasInteraction(
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
    )

  useCanvasCleanup(recentlyDraggedRef, interpolatedPositionsRef, magnetsRef, lastSentPositionRef)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const handleCanvasClick = () => {
      const activeElement = document.activeElement
      if (
        activeElement &&
        (activeElement.classList.contains("chat-input") ||
          activeElement.classList.contains("chat-name-input"))
      ) {
        activeElement.blur()
      }
    }

    container.addEventListener("click", handleCanvasClick)
    return () => {
      container.removeEventListener("click", handleCanvasClick)
    }
  }, [])

  const canvasClassName = `fridge-canvas ${draggingIndex !== null ? "dragging" : ""} ${isPanning ? "panning" : ""}`

  return (
    <div className="canvas-wrapper">
      <div ref={containerRef} className="canvas-container">
        <canvas
          ref={canvasRef}
          id="fridge"
          className={canvasClassName}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        />
      </div>
    </div>
  )
}
