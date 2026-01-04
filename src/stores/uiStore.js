import { create } from "zustand"
import { DARK_MODE_STORAGE_KEY, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/src/lib/constants.js"

function updateDOMClass(isDarkMode) {
  if (typeof document === "undefined") {
    return
  }

  if (isDarkMode) {
    document.documentElement.classList.add("dark-mode")
  } else {
    document.documentElement.classList.remove("dark-mode")
  }
}

// Always start with default (dark mode) to ensure SSR/client match
// Will be synced from localStorage or system preference on client mount
export const useUIStore = create((set) => ({
  // Dark mode state
  isDarkMode: true,
  isHydrated: false,

  // Chat state
  isChatOpen: false,
  shouldFocusChat: false,

  // Header state
  isHeaderVisible: true,

  // Ping display state
  isPingDisplayVisible: false,

  // Mobile detection state
  isMobile: false,

  // Multi-tap detection state (for header toggle, home, ping)
  lastTapTime: 0,
  tapCount: 0,
  touchStartTime: null,

  // Dark mode actions
  initialize: () => {
    if (typeof window === "undefined") {
      return
    }

    const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY)
    let initialMode

    if (stored !== null) {
      // User has a stored preference, use it
      initialMode = stored === "true"
    } else {
      // No stored preference, detect system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      initialMode = prefersDark
    }

    set({ isDarkMode: initialMode, isHydrated: true })
    updateDOMClass(initialMode)
  },

  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.isDarkMode
      updateDOMClass(newDarkMode)
      if (typeof window !== "undefined") {
        localStorage.setItem(DARK_MODE_STORAGE_KEY, String(newDarkMode))
      }
      return { isDarkMode: newDarkMode }
    })
  },

  // Chat actions
  toggleChat: () => {
    set((state) => ({
      isChatOpen: !state.isChatOpen,
      shouldFocusChat: true,
    }))
  },

  openChat: () => {
    set({ isChatOpen: true, shouldFocusChat: true })
  },

  closeChat: () => {
    set({ isChatOpen: false, shouldFocusChat: false })
  },

  setShouldFocusChat: (value) => {
    set({ shouldFocusChat: value })
  },

  // Header actions
  toggleHeader: () => {
    set((state) => ({ isHeaderVisible: !state.isHeaderVisible }))
  },

  // Ping display actions
  togglePingDisplay: () => {
    set((state) => ({ isPingDisplayVisible: !state.isPingDisplayVisible }))
  },

  // Canvas home function
  home: () => {
    if (typeof document === "undefined") {
      return
    }
    const container = document.querySelector(".canvas-container")
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
  },

  // Mobile detection actions
  checkMobile: () => {
    if (typeof window === "undefined") {
      return
    }
    set({ isMobile: window.innerWidth <= 768 })
  },

  // Multi-tap detection actions
  // Note: Validation (duration < 300ms, delta < 10px) is done by the caller
  // This function only handles tap counting logic
  handleTouchStart: () => {
    set({
      touchStartTime: Date.now(),
    })
  },

  handleTouchEnd: () => {
    const state = useUIStore.getState()
    if (!state.touchStartTime) {
      return 0
    }

    const currentTime = Date.now()
    const timeSinceLastTap = currentTime - state.lastTapTime

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      const newTapCount = state.tapCount + 1
      set({
        lastTapTime: currentTime,
        tapCount: newTapCount,
        touchStartTime: null,
      })
      return newTapCount
    } else {
      set({
        lastTapTime: currentTime,
        tapCount: 1,
        touchStartTime: null,
      })
      return 0
    }
  },

  resetTapCount: () => {
    set({ tapCount: 0, lastTapTime: 0 })
  },
}))
