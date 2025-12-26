import { useState, useEffect } from 'react'
import { Trash2, FolderGit2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUiStore } from '@/stores/uiStore'
import { api } from '@/lib/ipc'
import type { WorktreeInfo } from '@shared/types'

export function ManageWorktreesDialog() {
  const { showManageWorktreesDialog, setShowManageWorktreesDialog } = useUiStore()

  const [repoPath, setRepoPath] = useState('')
  const [worktrees, setWorktrees] = useState<WorktreeInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog closes
  useEffect(() => {
    if (!showManageWorktreesDialog) {
      setRepoPath('')
      setWorktrees([])
      setError(null)
    }
  }, [showManageWorktreesDialog])

  async function handleSelectRepo() {
    const path = await api.selectFolder()
    if (path) {
      setRepoPath(path)
      await loadWorktrees(path)
    }
  }

  async function loadWorktrees(path: string) {
    setIsLoading(true)
    setError(null)
    try {
      const isRepo = await api.isGitRepo(path)
      if (!isRepo) {
        setError('Selected folder is not a git repository')
        setWorktrees([])
        return
      }
      const list = await api.listAllWorktrees(path)
      setWorktrees(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load worktrees')
      setWorktrees([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(worktreePath: string) {
    setDeletingPath(worktreePath)
    try {
      await api.deleteWorktree(repoPath, worktreePath)
      await loadWorktrees(repoPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete worktree')
    } finally {
      setDeletingPath(null)
    }
  }

  // Filter out the main worktree (the actual repo)
  const agentWorktrees = worktrees.filter(wt => !wt.isMain)

  return (
    <Dialog open={showManageWorktreesDialog} onOpenChange={setShowManageWorktreesDialog}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Worktrees</DialogTitle>
          <DialogDescription>
            View and clean up git worktrees created by agent sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Repository selection */}
          <div className="grid gap-2">
            <Label>Repository</Label>
            <div className="flex gap-2">
              <Input
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="Select a repository..."
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectRepo}>
                <FolderGit2 className="h-4 w-4" />
              </Button>
              {repoPath && (
                <Button variant="outline" onClick={() => loadWorktrees(repoPath)}>
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Worktrees list */}
          {repoPath && (
            <div className="grid gap-2">
              <Label>Agent Worktrees ({agentWorktrees.length})</Label>
              <ScrollArea className="h-64 rounded-md border">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : agentWorktrees.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No agent worktrees found
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {agentWorktrees.map((wt) => (
                      <div
                        key={wt.path}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{wt.branch}</p>
                          <p className="text-xs text-muted-foreground truncate">{wt.path}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(wt.path)}
                          disabled={deletingPath === wt.path}
                        >
                          {deletingPath === wt.path ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
