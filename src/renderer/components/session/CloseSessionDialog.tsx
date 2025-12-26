import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'

export function CloseSessionDialog() {
  const { showCloseSessionDialog, setShowCloseSessionDialog } = useUiStore()
  const { sessions, activeSessionId, closeSession } = useSessionStore()
  const [deleteWorktree, setDeleteWorktree] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const session = sessions.find((s) => s.id === activeSessionId)

  async function handleClose() {
    if (!session) return

    setIsLoading(true)
    try {
      await closeSession(session.id, deleteWorktree && session.isGitRepo)
      setShowCloseSessionDialog(false)
    } catch (err) {
      console.error('Failed to close session:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) return null

  return (
    <AlertDialog open={showCloseSessionDialog} onOpenChange={setShowCloseSessionDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to close &quot;{session.name}&quot;?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {session.isGitRepo && session.worktreePath && (
          <div className="flex items-center space-x-2 py-2">
            <input
              type="checkbox"
              id="deleteWorktree"
              checked={deleteWorktree}
              onChange={(e) => setDeleteWorktree(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="deleteWorktree" className="text-sm font-normal">
              Delete git worktree and branch
            </Label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClose} disabled={isLoading}>
            {isLoading ? 'Closing...' : 'Close Session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
