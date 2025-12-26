import { create } from 'zustand'

interface UiStore {
  showNewSessionDialog: boolean
  showCloseSessionDialog: boolean
  showManageWorktreesDialog: boolean
  selectedFileForDiff: string | null
  sidebarCollapsed: boolean
  changesPanelCollapsed: boolean

  // Actions
  setShowNewSessionDialog: (show: boolean) => void
  setShowCloseSessionDialog: (show: boolean) => void
  setShowManageWorktreesDialog: (show: boolean) => void
  setSelectedFileForDiff: (filePath: string | null) => void
  toggleSidebar: () => void
  toggleChangesPanel: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  showNewSessionDialog: false,
  showCloseSessionDialog: false,
  showManageWorktreesDialog: false,
  selectedFileForDiff: null,
  sidebarCollapsed: false,
  changesPanelCollapsed: false,

  setShowNewSessionDialog: (show) => set({ showNewSessionDialog: show }),
  setShowCloseSessionDialog: (show) => set({ showCloseSessionDialog: show }),
  setShowManageWorktreesDialog: (show) => set({ showManageWorktreesDialog: show }),
  setSelectedFileForDiff: (filePath) => set({ selectedFileForDiff: filePath }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleChangesPanel: () =>
    set((state) => ({ changesPanelCollapsed: !state.changesPanelCollapsed })),
}))
