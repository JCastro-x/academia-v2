import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // Modal state
  isModalOpen: false,
  modalContent: null,
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  // Confirm dialog state
  confirmDialog: null,
  openConfirmDialog: (config) => set({ confirmDialog: config }),
  closeConfirmDialog: () => set({ confirmDialog: null }),

  // Lightbox state
  lightbox: null,
  openLightbox: (config) => set({ lightbox: config }),
  closeLightbox: () => set({ lightbox: null }),

  // Undo toast state
  undoToast: null,
  showUndoToast: (config) => set({ undoToast: config }),
  hideUndoToast: () => set({ undoToast: null }),

  // Pending deletes (items waiting for undo timeout)
  pendingDeletes: [],
  addPendingDelete: (item) => set((state) => ({
    pendingDeletes: [...state.pendingDeletes, { ...item, id: Date.now() }]
  })),
  removePendingDelete: (itemId) => set((state) => ({
    pendingDeletes: state.pendingDeletes.filter((item) => item.id !== itemId)
  })),

  // Sidebar state
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // Toast state
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: Date.now() }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  // Sound state
  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setMuted: (muted) => set({ isMuted: muted }),
}))
