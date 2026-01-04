import { create } from "zustand"
import { calculateDistance } from "@/src/components/FridgeCanvas/utils.js"

export const useMagnetStore = create((set, get) => ({
  magnets: [],
  draggingIndex: null,
  lastInteracted: new Map(),

  initializeMagnets: (magnets) => {
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

  // Get lookup table mapping letters or sprites to arrays of { magnet, index, distance, ... } objects
  // distance is calculated from the target point (for choosing closest/furthest)
  // Case-insensitive: normalizes letters to uppercase, sprites to lowercase
  getLookup: (targetX, targetY, type = "letter", useClosest = true) => {
    const state = get()
    const lookup = new Map()
    const isLetter = type === "letter"

    state.magnets.forEach((magnet, index) => {
      const value = isLetter ? magnet.letter : magnet.sprite
      if (value) {
        const normalizedKey = isLetter ? value.toUpperCase() : value.toLowerCase()
        const distance = calculateDistance(magnet.x, magnet.y, targetX, targetY)

        if (!lookup.has(normalizedKey)) {
          lookup.set(normalizedKey, [])
        }

        const entry = {
          magnet,
          index,
          distance,
        }

        if (!isLetter) {
          entry.radius = magnet.radius
        }

        lookup.get(normalizedKey).push(entry)
      }
    })

    // Sort each key's magnets by distance (closest or furthest first)
    lookup.forEach((magnets) => {
      magnets.sort((a, b) => {
        if (useClosest) {
          return a.distance - b.distance
        } else {
          return b.distance - a.distance
        }
      })
    })

    return lookup
  },

  getLetterLookup: (targetX, targetY, useClosest = true) => {
    return get().getLookup(targetX, targetY, "letter", useClosest)
  },

  getSpriteLookup: (targetX, targetY, useClosest = true) => {
    return get().getLookup(targetX, targetY, "sprite", useClosest)
  },

  getAvailableSprites: () => {
    const state = get()
    const sprites = new Set()

    state.magnets.forEach((magnet) => {
      if (magnet.sprite) {
        sprites.add(magnet.sprite.toLowerCase())
      }
    })

    return Array.from(sprites).sort()
  },
}))
