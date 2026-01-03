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

  // Get lookup table mapping letters to arrays of { magnet, index, distance } objects
  // distance is calculated from the target point (for choosing closest/furthest)
  // Case-insensitive: normalizes all letters to uppercase for lookup
  getLetterLookup: (targetX, targetY, useClosest = true) => {
    const state = get()
    const lookup = new Map()

    state.magnets.forEach((magnet, index) => {
      if (magnet.letter) {
        const normalizedLetter = magnet.letter.toUpperCase()
        const distance = Math.sqrt(
          Math.pow(magnet.x - targetX, 2) + Math.pow(magnet.y - targetY, 2)
        )

        if (!lookup.has(normalizedLetter)) {
          lookup.set(normalizedLetter, [])
        }

        lookup.get(normalizedLetter).push({
          magnet,
          index,
          distance,
        })
      }
    })

    // Sort each letter's magnets by distance (closest or furthest first)
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

  // Get lookup table mapping sprite names to arrays of { magnet, index, distance, radius } objects
  // distance is calculated from the target point (for choosing closest/furthest)
  getSpriteLookup: (targetX, targetY, useClosest = true) => {
    const state = get()
    const lookup = new Map()

    state.magnets.forEach((magnet, index) => {
      if (magnet.sprite) {
        const spriteName = magnet.sprite.toLowerCase()
        const distance = Math.sqrt(
          Math.pow(magnet.x - targetX, 2) + Math.pow(magnet.y - targetY, 2)
        )

        if (!lookup.has(spriteName)) {
          lookup.set(spriteName, [])
        }

        lookup.get(spriteName).push({
          magnet,
          index,
          distance,
          radius: magnet.radius,
        })
      }
    })

    // Sort each sprite's magnets by distance (closest or furthest first)
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

  // Get list of all available sprite names (for autocomplete/reference)
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
