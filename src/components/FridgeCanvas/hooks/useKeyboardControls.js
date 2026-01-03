import { useEffect } from "react"
import { KEYBOARD_SCROLL_AMOUNT, ADMIN_KEY_COMBO } from "@/src/lib/constants.js"

export function useKeyboardControls(
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
) {
  useEffect(() => {
    const isAdminKeyCombo = (event) => {
      const requiredKeys = new Set(ADMIN_KEY_COMBO)
      const pressedKeys = new Set()

      if (event.ctrlKey) {
        pressedKeys.add("Control")
      }
      if (event.shiftKey) {
        pressedKeys.add("Shift")
      }
      if (event.altKey) {
        pressedKeys.add("Alt")
      }
      pressedKeys.add(event.code)

      if (requiredKeys.size !== pressedKeys.size) {
        return false
      }

      for (const key of requiredKeys) {
        if (!pressedKeys.has(key)) {
          return false
        }
      }

      return true
    }

    const handleKeyDown = (e) => {
      const container = containerRef.current
      if (!container) {
        return
      }

      // Admin authentication modal
      if (isAdminKeyCombo(e) && !isAdminAuthenticated && !isAdminAuthModalOpen) {
        e.preventDefault()
        openAdminAuthModal()
        return
      }

      // Admin panel shortcuts (only when authenticated)
      if (isAdminAuthenticated) {
        if (e.ctrlKey && e.key === "ArrowUp" && !e.shiftKey && !e.altKey) {
          e.preventDefault()
          openAdminPanel()
          return
        }
        if (e.ctrlKey && e.key === "ArrowDown" && !e.shiftKey && !e.altKey) {
          e.preventDefault()
          closeAdminPanel()
          return
        }
      }

      // Chat controls
      if (e.key === "Enter") {
        const activeElement = document.activeElement
        const isChatInputFocused =
          activeElement &&
          (activeElement.classList.contains("chat-input") ||
            activeElement.classList.contains("chat-name-input"))
        if (!isChatOpen && !isChatInputFocused) {
          e.preventDefault()
          openChat()
        } else if (isChatOpen && !isChatInputFocused) {
          e.preventDefault()
          setShouldFocusChat(true)
        }
        return
      }

      if (e.key === "Escape") {
        if (isChatOpen) {
          e.preventDefault()
          closeChat()
          const activeElement = document.activeElement
          if (
            activeElement &&
            (activeElement.classList.contains("chat-input") ||
              activeElement.classList.contains("chat-name-input"))
          ) {
            activeElement.blur()
          }
        }
        return
      }

      // Navigation and utility controls
      const key = e.key.toLowerCase()
      if (key === "z") {
        e.preventDefault()
        toggleHeader()
        return
      }

      if (key === "h") {
        home()
        return
      }

      // Canvas scrolling controls
      if (key === "w") {
        container.scrollBy(0, -KEYBOARD_SCROLL_AMOUNT)
        return
      }

      if (key === "s") {
        container.scrollBy(0, KEYBOARD_SCROLL_AMOUNT)
        return
      }

      if (key === "q" || key === "a") {
        container.scrollBy(-KEYBOARD_SCROLL_AMOUNT, 0)
        return
      }

      if (key === "e" || key === "d") {
        container.scrollBy(KEYBOARD_SCROLL_AMOUNT, 0)
        return
      }

      // Debug controls
      if (key === "x" && process.env.NODE_ENV === "development") {
        setShowDebug((prev) => !prev)
        return
      }

      // Ping display toggle
      if (key === "p") {
        e.preventDefault()
        togglePingDisplay()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
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
    togglePingDisplay,
  ])
}
