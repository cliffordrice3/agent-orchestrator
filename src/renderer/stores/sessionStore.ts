import { create } from 'zustand'
import type { Session, FileChange, GitStatus, AgentType } from '@shared/types'
import { api } from '@/lib/ipc'

interface SessionStore {
  sessions: Session[]
  activeSessionId: string | null
  terminalOutputs: Record<string, string>
  gitStatuses: Record<string, GitStatus>
  reviewedFiles: Record<string, Set<string>>
  isLoading: boolean

  // Actions
  loadSessions: () => Promise<void>
  createSession: (config: {
    repoPath: string
    name: string
    branch: string
    agent: AgentType
  }) => Promise<Session>
  closeSession: (sessionId: string, deleteWorktree: boolean) => Promise<void>
  setActiveSession: (sessionId: string | null) => void
  appendTerminalOutput: (sessionId: string, data: string) => void
  clearTerminalOutput: (sessionId: string) => void
  refreshGitStatus: (sessionId: string) => Promise<void>
  markFileReviewed: (sessionId: string, filePath: string) => void
  unmarkFileReviewed: (sessionId: string, filePath: string) => void
  clearReviewedFiles: (sessionId: string) => void
  isFileReviewed: (sessionId: string, filePath: string) => boolean
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  terminalOutputs: {},
  gitStatuses: {},
  reviewedFiles: {},
  isLoading: false,

  loadSessions: async () => {
    set({ isLoading: true })
    try {
      const sessions = await api.getSessions()
      set({ sessions, isLoading: false })
      if (sessions.length > 0 && !get().activeSessionId) {
        set({ activeSessionId: sessions[0].id })
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
      set({ isLoading: false })
    }
  },

  createSession: async (config) => {
    set({ isLoading: true })
    try {
      const session = await api.createSession(config)
      set((state) => ({
        sessions: [...state.sessions, session],
        activeSessionId: session.id,
        isLoading: false
      }))
      return session
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  closeSession: async (sessionId, deleteWorktree) => {
    try {
      await api.closeSession(sessionId, deleteWorktree)
      set((state) => {
        const newSessions = state.sessions.filter((s) => s.id !== sessionId)
        const newActiveId =
          state.activeSessionId === sessionId
            ? newSessions[0]?.id || null
            : state.activeSessionId

        const { [sessionId]: _, ...newOutputs } = state.terminalOutputs
        const { [sessionId]: __, ...newStatuses } = state.gitStatuses
        const { [sessionId]: ___, ...newReviewed } = state.reviewedFiles

        return {
          sessions: newSessions,
          activeSessionId: newActiveId,
          terminalOutputs: newOutputs,
          gitStatuses: newStatuses,
          reviewedFiles: newReviewed
        }
      })
    } catch (error) {
      console.error('Failed to close session:', error)
      throw error
    }
  },

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId })
  },

  appendTerminalOutput: (sessionId, data) => {
    set((state) => ({
      terminalOutputs: {
        ...state.terminalOutputs,
        [sessionId]: (state.terminalOutputs[sessionId] || '') + data
      }
    }))
  },

  clearTerminalOutput: (sessionId) => {
    set((state) => ({
      terminalOutputs: {
        ...state.terminalOutputs,
        [sessionId]: ''
      }
    }))
  },

  refreshGitStatus: async (sessionId) => {
    try {
      const status = await api.getGitStatus(sessionId)
      set((state) => ({
        gitStatuses: {
          ...state.gitStatuses,
          [sessionId]: status
        }
      }))
    } catch (error) {
      console.error('Failed to refresh git status:', error)
    }
  },

  markFileReviewed: (sessionId, filePath) => {
    set((state) => {
      const current = state.reviewedFiles[sessionId] || new Set()
      const updated = new Set(current)
      updated.add(filePath)
      return {
        reviewedFiles: {
          ...state.reviewedFiles,
          [sessionId]: updated
        }
      }
    })
  },

  unmarkFileReviewed: (sessionId, filePath) => {
    set((state) => {
      const current = state.reviewedFiles[sessionId] || new Set()
      const updated = new Set(current)
      updated.delete(filePath)
      return {
        reviewedFiles: {
          ...state.reviewedFiles,
          [sessionId]: updated
        }
      }
    })
  },

  clearReviewedFiles: (sessionId) => {
    set((state) => ({
      reviewedFiles: {
        ...state.reviewedFiles,
        [sessionId]: new Set()
      }
    }))
  },

  isFileReviewed: (sessionId, filePath) => {
    return get().reviewedFiles[sessionId]?.has(filePath) || false
  }
}))
