import { create } from "zustand"

export const useAdminStore = create((set) => ({
  isAdminAuthenticated: false,
  isAdminPanelOpen: false,
  isAdminAuthModalOpen: false,
  isSelectingSummonCoordinates: false,
  summonCoordinates: { x: null, y: null },

  setAdminAuthenticated: (value) => {
    set({ isAdminAuthenticated: value })
  },

  toggleAdminPanel: () => {
    set((state) => ({ isAdminPanelOpen: !state.isAdminPanelOpen }))
  },

  openAdminPanel: () => {
    set({ isAdminPanelOpen: true })
  },

  closeAdminPanel: () => {
    set({ isAdminPanelOpen: false })
  },

  openAdminAuthModal: () => {
    set({ isAdminAuthModalOpen: true })
  },

  closeAdminAuthModal: () => {
    set({ isAdminAuthModalOpen: false })
  },

  setSelectingSummonCoordinates: (value) => {
    set({ isSelectingSummonCoordinates: value })
  },

  setSummonCoordinates: (x, y) => {
    set({ summonCoordinates: { x, y } })
  },
}))
