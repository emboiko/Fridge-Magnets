import { create } from "zustand"
import { DARK_MODE_STORAGE_KEY } from "@/src/lib/constants.js"

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
}))
