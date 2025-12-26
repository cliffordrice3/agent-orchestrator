import simpleGit, { SimpleGit } from 'simple-git'
import { join, basename, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import type { GitStatus, FileChange, WorktreeInfo } from '../../shared/types'

export class GitService {
  async isGitRepo(path: string): Promise<boolean> {
    try {
      const git = simpleGit(path)
      return await git.checkIsRepo()
    } catch {
      return false
    }
  }

  async getBranches(repoPath: string): Promise<string[]> {
    const git = simpleGit(repoPath)
    const branchSummary = await git.branchLocal()
    return branchSummary.all
  }

  async getCurrentBranch(repoPath: string): Promise<string> {
    const git = simpleGit(repoPath)
    const branchSummary = await git.branchLocal()
    return branchSummary.current
  }

  async createWorktree(
    repoPath: string,
    sessionId: string,
    baseBranch: string
  ): Promise<string> {
    const git = simpleGit(repoPath)

    // Create worktrees directory if it doesn't exist
    const worktreesDir = join(repoPath, '.worktrees')
    if (!existsSync(worktreesDir)) {
      mkdirSync(worktreesDir, { recursive: true })
    }

    const worktreePath = join(worktreesDir, sessionId)
    const branchName = `agent/${sessionId}`

    // Create a new branch from the base branch and set up worktree
    await git.raw(['worktree', 'add', '-b', branchName, worktreePath, baseBranch])

    return worktreePath
  }

  async deleteWorktree(repoPath: string, worktreePath: string): Promise<void> {
    const git = simpleGit(repoPath)

    // Get the branch name associated with this worktree
    const worktrees = await this.listWorktrees(repoPath)
    const worktree = worktrees.find(wt => wt.path === worktreePath)
    const branchToDelete = worktree?.branch

    // Remove the worktree
    await git.raw(['worktree', 'remove', worktreePath, '--force'])

    // Delete the branch if it was an agent branch
    if (branchToDelete && branchToDelete.startsWith('agent/')) {
      try {
        await git.raw(['branch', '-D', branchToDelete])
      } catch {
        // Branch might already be deleted or not exist
      }
    }
  }

  async listWorktrees(repoPath: string): Promise<WorktreeInfo[]> {
    const git = simpleGit(repoPath)
    const result = await git.raw(['worktree', 'list', '--porcelain'])

    const worktrees: WorktreeInfo[] = []
    const lines = result.split('\n')

    let currentPath = ''
    let currentBranch = ''

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        currentPath = line.substring(9)
      } else if (line.startsWith('branch refs/heads/')) {
        currentBranch = line.substring(18)
      } else if (line === '') {
        if (currentPath) {
          worktrees.push({
            path: currentPath,
            branch: currentBranch,
            isMain: currentPath === repoPath || !currentPath.includes('.worktrees')
          })
        }
        currentPath = ''
        currentBranch = ''
      }
    }

    return worktrees
  }

  async getStatus(workingDir: string): Promise<GitStatus> {
    const git = simpleGit(workingDir)

    const status = await git.status()
    const branchInfo = await git.branch()

    const files: FileChange[] = []

    // Process all file changes
    for (const file of status.files) {
      let changeStatus: FileChange['status'] = 'modified'

      if (file.index === 'A' || file.working_dir === 'A') {
        changeStatus = 'added'
      } else if (file.index === 'D' || file.working_dir === 'D') {
        changeStatus = 'deleted'
      } else if (file.index === 'R' || file.working_dir === 'R') {
        changeStatus = 'renamed'
      } else if (file.index === '?' || file.working_dir === '?') {
        changeStatus = 'untracked'
      }

      files.push({
        path: file.path,
        status: changeStatus,
        oldPath: file.from // For renames
      })
    }

    return {
      files,
      branch: branchInfo.current,
      ahead: status.ahead,
      behind: status.behind
    }
  }

  async getFileDiff(workingDir: string, filePath: string): Promise<string> {
    const git = simpleGit(workingDir)

    try {
      // Get diff for the specific file
      const diff = await git.diff(['HEAD', '--', filePath])
      return diff || ''
    } catch {
      // If file is untracked, return empty diff
      return ''
    }
  }

  async getFileContent(workingDir: string, filePath: string): Promise<string> {
    const { readFile } = await import('fs/promises')
    const fullPath = join(workingDir, filePath)

    try {
      return await readFile(fullPath, 'utf-8')
    } catch {
      return ''
    }
  }

  async getOriginalFileContent(workingDir: string, filePath: string): Promise<string> {
    const git = simpleGit(workingDir)

    try {
      // Get the file content from HEAD
      const content = await git.show([`HEAD:${filePath}`])
      return content
    } catch {
      // File might be new
      return ''
    }
  }
}

export const gitService = new GitService()
