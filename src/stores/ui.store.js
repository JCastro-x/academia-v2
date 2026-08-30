import { create } from 'zustand'

const readStoredTheme = () => {
  if (typeof window === 'undefined') {
    return {
      modoOscuro: false,
      tipografia: 'Inter',
      temaColor: '#84cc16',
    }
  }

  return {
    modoOscuro: localStorage.getItem('academia-theme-dark') === 'true',
    tipografia: localStorage.getItem('academia-theme-font') || 'Inter',
    temaColor: localStorage.getItem('academia-theme-color') || '#84cc16',
  }
}

const initialTheme = readStoredTheme()
const readStoredHoraFormato = () => {
  if (typeof window === 'undefined') {
    return '12h'
  }

  const saved = localStorage.getItem('academia-hora-formato')
  return saved === '24h' || saved === '12h' ? saved : '12h'
}

export const useUIStore = create((set) => ({
  // Theme state (preview en vivo, se guarda aparte en profiles)
  modoOscuro: initialTheme.modoOscuro,
  tipografia: initialTheme.tipografia,
  temaColor: initialTheme.temaColor,
  sonidosInteraccion: 'classic',
  horaFormato: readStoredHoraFormato(),
  setModoOscuro: (val) => {
    if (typeof window !== 'undefined') localStorage.setItem('academia-theme-dark', String(val))
    set({ modoOscuro: val })
  },
  setTipografia: (val) => {
    if (typeof window !== 'undefined') localStorage.setItem('academia-theme-font', val)
    set({ tipografia: val })
  },
  setTemaColor: (val) => {
    if (typeof window !== 'undefined') localStorage.setItem('academia-theme-color', val)
    set({ temaColor: val })
  },
  setSonidosInteraccion: (val) => set({ sonidosInteraccion: val }),
  setHoraFormato: (val) => {
    const normalized = val === '24h' ? '24h' : '12h'
    if (typeof window !== 'undefined') localStorage.setItem('academia-hora-formato', normalized)
    set({ horaFormato: normalized })
  },
  resetTheme: () => {
    const defaultTheme = {
      modoOscuro: false,
      tipografia: 'Inter',
      temaColor: '#84cc16',
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('academia-theme-dark', String(defaultTheme.modoOscuro))
      localStorage.setItem('academia-theme-font', defaultTheme.tipografia)
      localStorage.setItem('academia-theme-color', defaultTheme.temaColor)
    }

    if (typeof window !== 'undefined') localStorage.setItem('academia-hora-formato', '12h')

    set({
      modoOscuro: defaultTheme.modoOscuro,
      tipografia: defaultTheme.tipografia,
      temaColor: defaultTheme.temaColor,
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

  // Online state
  isOnline: true,
  setOnline: () => set({ isOnline: true }),
  setOffline: () => set({ isOnline: false }),

  // Sound state
  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setMuted: (muted) => set({ isMuted: muted }),
}))
