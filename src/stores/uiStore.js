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
// Will be synced from localStorage on client mount
export const useUIStore = create((set) => ({
  // Dark mode state
  isDarkMode: true,
  isHydrated: false,

  // Chat state
  isChatOpen: false,
  shouldFocusChat: false,

  // Header state
  isHeaderVisible: true,

  // Dark mode actions
  initialize: () => {
    if (typeof window === "undefined") {
      return
    }

    const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY)
    const storedMode = stored === null ? true : stored === "true"

    set({ isDarkMode: storedMode, isHydrated: true })
    updateDOMClass(storedMode)
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
}))
