export type AgentType = 'claude-code' | 'codex' | 'cursor'

export interface Session {
  id: string
  name: string
  repoPath: string
  worktreePath: string | null
  branch: string
  baseBranch: string
  agent: AgentType
  isGitRepo: boolean
  createdAt: number
}

export interface FileChange {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked'
  oldPath?: string // For renames
}

export interface GitStatus {
  files: FileChange[]
  branch: string
  ahead: number
  behind: number
}

export interface SessionState {
  sessions: Session[]
  activeSessionId: string | null
  reviewedFiles: Record<string, string[]> // sessionId -> reviewed file paths
}

export interface StoredData {
  sessions: Session[]
  reviewedFiles: Record<string, string[]>
}

// IPC Channel Types
export interface IpcApi {
  // Session management
  createSession: (config: CreateSessionConfig) => Promise<Session>
  closeSession: (sessionId: string, deleteWorktree: boolean) => Promise<void>
  getSessions: () => Promise<Session[]>

  // Git operations
  isGitRepo: (path: string) => Promise<boolean>
  getBranches: (path: string) => Promise<string[]>
  getGitStatus: (sessionId: string) => Promise<GitStatus>
  getFileDiff: (sessionId: string, filePath: string) => Promise<string>
  getFileDiffAgainstStaged: (
    sessionId: string,
    filePath: string,
    stagedContent: string
  ) => Promise<string>

  // Terminal operations
  sendInput: (sessionId: string, data: string) => Promise<void>
  resizeTerminal: (sessionId: string, cols: number, rows: number) => Promise<void>

  // File operations
  selectFolder: () => Promise<string | null>
  openInVSCode: (path: string, files?: string[]) => Promise<void>
  getFileContent: (sessionId: string, filePath: string) => Promise<string>
  getOriginalFileContent: (sessionId: string, filePath: string) => Promise<string>

  // Worktree management
  listAllWorktrees: (repoPath: string) => Promise<WorktreeInfo[]>
  deleteWorktree: (repoPath: string, worktreePath: string) => Promise<void>

  // Event listeners
  onTerminalOutput: (callback: (sessionId: string, data: string) => void) => () => void
  onTerminalExit: (callback: (sessionId: string, code: number) => void) => () => void
}

export interface CreateSessionConfig {
  repoPath: string
  name: string
  branch: string
  agent: AgentType
}

export interface WorktreeInfo {
  path: string
  branch: string
  isMain: boolean
}

// Agent configurations
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  'claude-code': {
    name: 'Claude Code',
    command: 'claude',
    args: [],
    available: true,
  },
  codex: {
    name: 'Codex',
    command: 'codex',
    args: [],
    available: false, // Stubbed
  },
  cursor: {
    name: 'Cursor',
    command: 'cursor',
    args: ['--chat'],
    available: false, // Stubbed
  },
}

export interface AgentConfig {
  name: string
  command: string
  args: string[]
  available: boolean
}
