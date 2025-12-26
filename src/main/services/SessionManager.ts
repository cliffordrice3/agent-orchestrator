import { v4 as uuidv4 } from 'uuid'
import { gitService } from './GitService'
import { terminalManager } from './TerminalManager'
import { storageService } from './StorageService'
import type { Session, CreateSessionConfig } from '../../shared/types'

export class SessionManager {
  private activeSessions: Map<string, Session> = new Map()

  constructor() {
    // Load persisted sessions on startup
    const savedSessions = storageService.getSessions()
    for (const session of savedSessions) {
      this.activeSessions.set(session.id, session)
    }
  }

  async createSession(config: CreateSessionConfig): Promise<Session> {
    const sessionId = uuidv4().substring(0, 8)
    const isGitRepo = await gitService.isGitRepo(config.repoPath)

    let worktreePath: string | null = null
    let baseBranch = config.branch

    if (isGitRepo) {
      // Get the current branch if no branch specified
      if (!baseBranch) {
        baseBranch = await gitService.getCurrentBranch(config.repoPath)
      }

      // Create a worktree for this session
      worktreePath = await gitService.createWorktree(
        config.repoPath,
        sessionId,
        baseBranch
      )
    }

    const session: Session = {
      id: sessionId,
      name: config.name || `Session ${sessionId}`,
      repoPath: config.repoPath,
      worktreePath,
      branch: isGitRepo ? `agent/${sessionId}` : '',
      baseBranch: baseBranch || '',
      agent: config.agent,
      isGitRepo,
      createdAt: Date.now()
    }

    this.activeSessions.set(session.id, session)
    storageService.addSession(session)

    // Create and start the terminal
    await terminalManager.createTerminal(session)

    return session
  }

  async closeSession(sessionId: string, deleteWorktree: boolean): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Close the terminal
    terminalManager.closeTerminal(sessionId)

    // Delete worktree if requested
    if (deleteWorktree && session.worktreePath && session.isGitRepo) {
      await gitService.deleteWorktree(session.repoPath, session.worktreePath)
    }

    // Remove from active sessions and storage
    this.activeSessions.delete(sessionId)
    storageService.removeSession(sessionId)
  }

  getSession(sessionId: string): Session | undefined {
    return this.activeSessions.get(sessionId)
  }

  getAllSessions(): Session[] {
    return Array.from(this.activeSessions.values())
  }

  getSessionWorkingDir(sessionId: string): string {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }
    return session.worktreePath || session.repoPath
  }
}

export const sessionManager = new SessionManager()
