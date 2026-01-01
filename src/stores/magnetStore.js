import { create } from "zustand"

export const useMagnetStore = create((set, get) => ({
  // Initial state
  magnets: [],
  draggingIndex: null,
  lastInteracted: new Map(),

  // Actions
  initializeMagnets: (magnets) => {
    // Initialize lastInteracted timestamps for all magnets
    const lastInteracted = new Map()
    magnets.forEach((_, index) => {
      lastInteracted.set(index, Date.now() - index) // Stagger initial timestamps to preserve original order
    })
    set({ magnets, lastInteracted })
  },

  updateMagnetByIndex: (index, updates) => {
    set((state) => {
      const newMagnets = [...state.magnets]
      newMagnets[index] = { ...newMagnets[index], ...updates }
      return { magnets: newMagnets }
    })
  },

  setDraggingIndex: (index) => {
    set({ draggingIndex: index })
  },

  markMagnetInteracted: (index) => {
    set((state) => {
      const newLastInteracted = new Map(state.lastInteracted)
      newLastInteracted.set(index, Date.now())
      return { lastInteracted: newLastInteracted }
    })
  },

  // Get magnets sorted by lastInteracted (most recent on top)
  // Returns array of { magnet, index } pairs sorted by z-index
  getSortedMagnets: () => {
    const state = get()
    return state.magnets
      .map((magnet, index) => ({
        magnet,
        index,
        timestamp: state.lastInteracted.get(index) ?? 0,
      }))
      .sort((a, b) => a.timestamp - b.timestamp) // Oldest first (will be drawn first)
      .map(({ magnet, index }) => ({ magnet, index }))
  },
}))
