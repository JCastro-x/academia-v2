import { create } from 'zustand'

const DEFAULT_THEME = {
  modoOscuro: false,
  tipografia: 'Inter',
  temaColor: '#84cc16',
}
export const useUIStore = create((set) => ({
  // Theme state is derived from the authenticated profile in Supabase.
  // localStorage is intentionally not used as a source of truth anymore.
  modoOscuro: DEFAULT_THEME.modoOscuro,
  tipografia: DEFAULT_THEME.tipografia,
  temaColor: DEFAULT_THEME.temaColor,
  sonidosInteraccion: 'classic',
  horaFormato: '12h',
  setModoOscuro: (val) => set({ modoOscuro: val }),
  setTipografia: (val) => set({ tipografia: val }),
  setTemaColor: (val) => set({ temaColor: val }),
  setSonidosInteraccion: (val) => set({ sonidosInteraccion: val }),
  setHoraFormato: (val) => set({ horaFormato: val === '24h' ? '24h' : '12h' }),
  resetTheme: () => {
    set({
      modoOscuro: DEFAULT_THEME.modoOscuro,
      tipografia: DEFAULT_THEME.tipografia,
      temaColor: DEFAULT_THEME.temaColor,
      sonidosInteraccion: 'classic',
      horaFormato: '12h',
    })
  },

  // Modal state
  isModalOpen: false,
  modalContent: null,
  modalPayload: null,
  openModal: (content, payload = null) => set({ isModalOpen: true, modalContent: content, modalPayload: payload }),
  closeModal: () => set({ isModalOpen: false, modalContent: null, modalPayload: null }),

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
  isSidebarCollapsed: true,
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

  // Online state
  isOnline: true,
  setOnline: () => set({ isOnline: true }),
  setOffline: () => set({ isOnline: false }),

  // Sound state
  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setMuted: (muted) => set({ isMuted: muted }),
}))
