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
import { useMagnetHover } from "./hooks/useMagnetHover.js"
import { calculateDistance } from "./utils.js"

export default function FridgeCanvas() {
  const isAdminAuthenticated = useAdminStore((state) => state.isAdminAuthenticated)
  const isAdminAuthModalOpen = useAdminStore((state) => state.isAdminAuthModalOpen)
  const openAdminAuthModal = useAdminStore((state) => state.openAdminAuthModal)
  const openAdminPanel = useAdminStore((state) => state.openAdminPanel)
  const closeAdminPanel = useAdminStore((state) => state.closeAdminPanel)
  const isSelectingSummonCoordinates = useAdminStore((state) => state.isSelectingSummonCoordinates)
  const setSelectingSummonCoordinates = useAdminStore(
    (state) => state.setSelectingSummonCoordinates
  )
  const setSummonCoordinates = useAdminStore((state) => state.setSummonCoordinates)
  const isChatOpen = useUIStore((state) => state.isChatOpen)
  const openChat = useUIStore((state) => state.openChat)
  const closeChat = useUIStore((state) => state.closeChat)
  const toggleHeader = useUIStore((state) => state.toggleHeader)
  const setShouldFocusChat = useUIStore((state) => state.setShouldFocusChat)
  const togglePingDisplay = useUIStore((state) => state.togglePingDisplay)
  const isMobile = useUIStore((state) => state.isMobile)
  const isHeaderVisible = useUIStore((state) => state.isHeaderVisible)
  const handleTouchStart = useUIStore((state) => state.handleTouchStart)
  const handleTouchEnd = useUIStore((state) => state.handleTouchEnd)
  const resetTapCount = useUIStore((state) => state.resetTapCount)
  const home = useUIStore((state) => state.home)
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
  const isPanningRef = useRef(false)

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
    isPanningRef.current = isPanning
  }, [isPanning])

  useEffect(() => {
    magnetsRef.current = magnets
    sortedMagnetsCacheRef.current = null
  }, [magnets])

  const { imageCacheRef, animationStateRef } = useImageLoading(magnets)

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

        const distance = calculateDistance(x, y, checkX, checkY)
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
    animationStateRef,
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
    closeAdminPanel,
    togglePingDisplay
  )

  const {
    handlePointerDown: baseHandlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useCanvasInteraction(
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

  const handlePointerDown = useCallback(
    (e) => {
      if (isSelectingSummonCoordinates) {
        e.preventDefault()
        const coords = getCanvasCoordinates(e.clientX, e.clientY)
        if (coords) {
          const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, Math.round(coords.x)))
          const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, Math.round(coords.y)))
          setSummonCoordinates(clampedX, clampedY)
          setSelectingSummonCoordinates(false)
        }
      } else {
        baseHandlePointerDown(e)
      }
    },
    [
      isSelectingSummonCoordinates,
      getCanvasCoordinates,
      setSummonCoordinates,
      setSelectingSummonCoordinates,
      baseHandlePointerDown,
    ]
  )

  useCanvasCleanup(recentlyDraggedRef, interpolatedPositionsRef, magnetsRef, lastSentPositionRef)

  const isHoveringMagnet = useMagnetHover(
    canvasRef,
    getCanvasCoordinates,
    findClickedMagnet,
    draggingIndex,
    isPanning,
    isSelectingSummonCoordinates
  )

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

  useEffect(() => {
    if (!isMobile) {
      return
    }

    const touchStartPositions = new Map()
    let tapTimeoutId = null
    let actionTimeoutId = null

    const executeAction = (tapCount) => {
      if (tapCount === 2) {
        toggleHeader()
      } else if (tapCount === 3) {
        if (home) {
          home()
        }
      } else if (tapCount === 4) {
        togglePingDisplay()
      }
      resetTapCount()
    }

    const handleDocumentTouchStart = (e) => {
      if (
        e.touches.length === 1 &&
        draggingIndexRef.current === null &&
        !e.target.closest("button") &&
        !e.target.closest("input") &&
        !e.target.closest("textarea")
      ) {
        const touch = e.touches[0]
        const identifier = touch.identifier
        touchStartPositions.set(identifier, {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        })
        handleTouchStart(touch.clientX, touch.clientY)
      }
    }

    const handleDocumentTouchMove = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        const identifier = touch.identifier
        const startPos = touchStartPositions.get(identifier)
        if (startPos) {
          const deltaX = Math.abs(touch.clientX - startPos.x)
          const deltaY = Math.abs(touch.clientY - startPos.y)
          if (deltaX > 10 || deltaY > 10) {
            touchStartPositions.delete(identifier)
            resetTapCount()
            if (actionTimeoutId) {
              clearTimeout(actionTimeoutId)
              actionTimeoutId = null
            }
          }
        }
      }
    }

    const handleDocumentTouchEnd = (e) => {
      if (
        e.changedTouches.length === 1 &&
        draggingIndexRef.current === null &&
        !e.target.closest("button") &&
        !e.target.closest("input") &&
        !e.target.closest("textarea")
      ) {
        const touchEnd = e.changedTouches[0]
        const identifier = touchEnd.identifier
        const startPos = touchStartPositions.get(identifier)

        if (startPos) {
          const deltaX = Math.abs(touchEnd.clientX - startPos.x)
          const deltaY = Math.abs(touchEnd.clientY - startPos.y)
          const touchDuration = Date.now() - startPos.time

          if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
            const tapCount = handleTouchEnd()

            if (tapCount > 0) {
              if (actionTimeoutId) {
                clearTimeout(actionTimeoutId)
              }

              if (tapTimeoutId) {
                clearTimeout(tapTimeoutId)
              }

              actionTimeoutId = setTimeout(() => {
                executeAction(tapCount)
                actionTimeoutId = null
              }, 300)

              tapTimeoutId = setTimeout(() => {
                resetTapCount()
                tapTimeoutId = null
              }, 300)
            }
          } else {
            resetTapCount()
            if (actionTimeoutId) {
              clearTimeout(actionTimeoutId)
              actionTimeoutId = null
            }
          }
          touchStartPositions.delete(identifier)
        }
      }
    }

    document.addEventListener("touchstart", handleDocumentTouchStart, {
      passive: true,
      capture: true,
    })
    document.addEventListener("touchmove", handleDocumentTouchMove, {
      passive: true,
      capture: true,
    })
    document.addEventListener("touchend", handleDocumentTouchEnd, { passive: false, capture: true })
    return () => {
      if (tapTimeoutId) {
        clearTimeout(tapTimeoutId)
      }
      if (actionTimeoutId) {
        clearTimeout(actionTimeoutId)
      }
      document.removeEventListener("touchstart", handleDocumentTouchStart, { capture: true })
      document.removeEventListener("touchmove", handleDocumentTouchMove, { capture: true })
      document.removeEventListener("touchend", handleDocumentTouchEnd, { capture: true })
    }
  }, [
    isMobile,
    isHeaderVisible,
    handleTouchStart,
    handleTouchEnd,
    toggleHeader,
    togglePingDisplay,
    home,
    resetTapCount,
  ])

  const canvasClassName = `fridge-canvas ${draggingIndex !== null ? "dragging" : ""} ${isPanning ? "panning" : ""} ${isSelectingSummonCoordinates ? "selecting-coordinates" : ""} ${isHoveringMagnet ? "hovering-magnet" : ""}`

  return (
    <div ref={containerRef} className="canvas-container">
      <div className="canvas-content-wrapper">
        <div
          className="canvas-background"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        />
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
