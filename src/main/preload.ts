import { contextBridge, ipcRenderer } from 'electron'
import type { IpcApi, CreateSessionConfig, Session, GitStatus, WorktreeInfo } from '../shared/types'

const api: IpcApi = {
  // Session management
  createSession: (config: CreateSessionConfig): Promise<Session> =>
    ipcRenderer.invoke('session:create', config),
  closeSession: (sessionId: string, deleteWorktree: boolean): Promise<void> =>
    ipcRenderer.invoke('session:close', sessionId, deleteWorktree),
  getSessions: (): Promise<Session[]> => ipcRenderer.invoke('session:list'),

  // Git operations
  isGitRepo: (path: string): Promise<boolean> => ipcRenderer.invoke('git:isRepo', path),
  getBranches: (path: string): Promise<string[]> => ipcRenderer.invoke('git:branches', path),
  getGitStatus: (sessionId: string): Promise<GitStatus> =>
    ipcRenderer.invoke('git:status', sessionId),
  getFileDiff: (sessionId: string, filePath: string): Promise<string> =>
    ipcRenderer.invoke('git:diff', sessionId, filePath),
  getFileDiffAgainstStaged: (
    sessionId: string,
    filePath: string,
    stagedContent: string
  ): Promise<string> =>
    ipcRenderer.invoke('git:diffAgainstStaged', sessionId, filePath, stagedContent),

  // Terminal operations
  sendInput: (sessionId: string, data: string): Promise<void> =>
    ipcRenderer.invoke('terminal:input', sessionId, data),
  resizeTerminal: (sessionId: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke('terminal:resize', sessionId, cols, rows),

  // File operations
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectFolder'),
  openInVSCode: (path: string, files?: string[]): Promise<void> =>
    ipcRenderer.invoke('vscode:open', path, files),
  getFileContent: (sessionId: string, filePath: string): Promise<string> =>
    ipcRenderer.invoke('file:content', sessionId, filePath),
  getOriginalFileContent: (sessionId: string, filePath: string): Promise<string> =>
    ipcRenderer.invoke('file:originalContent', sessionId, filePath),

  // Worktree management
  listAllWorktrees: (repoPath: string): Promise<WorktreeInfo[]> =>
    ipcRenderer.invoke('worktree:list', repoPath),
  deleteWorktree: (repoPath: string, worktreePath: string): Promise<void> =>
    ipcRenderer.invoke('worktree:delete', repoPath, worktreePath),

  // Event listeners
  onTerminalOutput: (callback: (sessionId: string, data: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, sessionId: string, data: string) => {
      callback(sessionId, data)
    }
    ipcRenderer.on('terminal:output', handler)
    return () => ipcRenderer.removeListener('terminal:output', handler)
  },
  onTerminalExit: (callback: (sessionId: string, code: number) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, sessionId: string, code: number) => {
      callback(sessionId, code)
    }
    ipcRenderer.on('terminal:exit', handler)
    return () => ipcRenderer.removeListener('terminal:exit', handler)
  },
}

contextBridge.exposeInMainWorld('api', api)
