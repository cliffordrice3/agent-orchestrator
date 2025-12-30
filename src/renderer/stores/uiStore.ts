import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentType } from '@shared/types'

interface LastSessionConfig {
  folderPath: string
  agent: AgentType
}

interface UiStore {
  showNewSessionDialog: boolean
  showCloseSessionDialog: boolean
  showManageWorktreesDialog: boolean
  selectedFileForDiff: string | null
  sidebarCollapsed: boolean
  changesPanelCollapsed: boolean
  lastSessionConfig: LastSessionConfig | null

  // Actions
  setShowNewSessionDialog: (show: boolean) => void
  setShowCloseSessionDialog: (show: boolean) => void
  setShowManageWorktreesDialog: (show: boolean) => void
  setSelectedFileForDiff: (filePath: string | null) => void
  toggleSidebar: () => void
  toggleChangesPanel: () => void
  setLastSessionConfig: (config: LastSessionConfig) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      showNewSessionDialog: false,
      showCloseSessionDialog: false,
      showManageWorktreesDialog: false,
      selectedFileForDiff: null,
      sidebarCollapsed: false,
      changesPanelCollapsed: false,
      lastSessionConfig: null,

      setShowNewSessionDialog: (show) => set({ showNewSessionDialog: show }),
      setShowCloseSessionDialog: (show) => set({ showCloseSessionDialog: show }),
      setShowManageWorktreesDialog: (show) => set({ showManageWorktreesDialog: show }),
      setSelectedFileForDiff: (filePath) => set({ selectedFileForDiff: filePath }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleChangesPanel: () =>
        set((state) => ({ changesPanelCollapsed: !state.changesPanelCollapsed })),
      setLastSessionConfig: (config) => set({ lastSessionConfig: config }),
    }),
    {
      name: 'agent-orchestrator-ui',
      partialize: (state) => ({ lastSessionConfig: state.lastSessionConfig }),
    }
  )
)
