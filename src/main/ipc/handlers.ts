import { ipcMain, dialog } from 'electron'
import type { BrowserWindow } from 'electron'
import { exec } from 'child_process'
import { sessionManager } from '../services/SessionManager'
import { terminalManager } from '../services/TerminalManager'
import { gitService } from '../services/GitService'
import { storageService } from '../services/StorageService'
import type { CreateSessionConfig } from '../../shared/types'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Set main window for terminal manager
  terminalManager.setMainWindow(mainWindow)

  // Session management
  ipcMain.handle('session:create', async (_, config: CreateSessionConfig) => {
    return sessionManager.createSession(config)
  })

  ipcMain.handle('session:close', async (_, sessionId: string, deleteWorktree: boolean) => {
    return sessionManager.closeSession(sessionId, deleteWorktree)
  })

  ipcMain.handle('session:list', async () => {
    return sessionManager.getAllSessions()
  })

  // Git operations
  ipcMain.handle('git:isRepo', async (_, path: string) => {
    return gitService.isGitRepo(path)
  })

  ipcMain.handle('git:branches', async (_, path: string) => {
    return gitService.getBranches(path)
  })

  ipcMain.handle('git:status', async (_, sessionId: string) => {
    const workingDir = sessionManager.getSessionWorkingDir(sessionId)
    return gitService.getStatus(workingDir)
  })

  ipcMain.handle('git:diff', async (_, sessionId: string, filePath: string) => {
    const workingDir = sessionManager.getSessionWorkingDir(sessionId)
    return gitService.getFileDiff(workingDir, filePath)
  })

  ipcMain.handle(
    'git:diffAgainstStaged',
    async (_, sessionId: string, filePath: string, _stagedContent: string) => {
      // For now, just return the regular diff
      // In a more advanced implementation, we could compute diff against staged content
      const workingDir = sessionManager.getSessionWorkingDir(sessionId)
      return gitService.getFileDiff(workingDir, filePath)
    }
  )

  // Terminal operations
  ipcMain.handle('terminal:input', async (_, sessionId: string, data: string) => {
    terminalManager.sendInput(sessionId, data)
  })

  ipcMain.handle('terminal:resize', async (_, sessionId: string, cols: number, rows: number) => {
    terminalManager.resizeTerminal(sessionId, cols, rows)
  })

  // File operations
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle('vscode:open', async (_, path: string, files?: string[]) => {
    const args = files && files.length > 0 ? [path, ...files.map((f) => `${path}/${f}`)] : [path]

    // On macOS, use 'open' with VS Code app bundle since 'code' CLI may not be in PATH
    const command =
      process.platform === 'darwin'
        ? `open -a "Visual Studio Code" ${args.map((a) => `"${a}"`).join(' ')}`
        : `code ${args.map((a) => `"${a}"`).join(' ')}`

    return new Promise<void>((resolve) => {
      exec(command, (error) => {
        if (error) {
          console.error('Failed to open VS Code:', error)
          // Fallback: try the 'code' CLI directly (user may have it in PATH)
          exec(`code ${args.map((a) => `"${a}"`).join(' ')}`, (codeError) => {
            if (codeError) {
              console.error('Code CLI also failed:', codeError)
            }
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  })

  ipcMain.handle('file:content', async (_, sessionId: string, filePath: string) => {
    const workingDir = sessionManager.getSessionWorkingDir(sessionId)
    return gitService.getFileContent(workingDir, filePath)
  })

  ipcMain.handle('file:originalContent', async (_, sessionId: string, filePath: string) => {
    const workingDir = sessionManager.getSessionWorkingDir(sessionId)
    return gitService.getOriginalFileContent(workingDir, filePath)
  })

  // Worktree management
  ipcMain.handle('worktree:list', async (_, repoPath: string) => {
    return gitService.listWorktrees(repoPath)
  })

  ipcMain.handle('worktree:delete', async (_, repoPath: string, worktreePath: string) => {
    return gitService.deleteWorktree(repoPath, worktreePath)
  })

  // Reviewed files
  ipcMain.handle('reviewed:get', async (_, sessionId: string) => {
    return storageService.getReviewedFiles(sessionId)
  })

  ipcMain.handle('reviewed:add', async (_, sessionId: string, filePath: string) => {
    storageService.addReviewedFile(sessionId, filePath)
  })

  ipcMain.handle('reviewed:remove', async (_, sessionId: string, filePath: string) => {
    storageService.removeReviewedFile(sessionId, filePath)
  })

  ipcMain.handle('reviewed:clear', async (_, sessionId: string) => {
    storageService.clearReviewedFiles(sessionId)
  })
}
