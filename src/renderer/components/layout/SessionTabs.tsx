import { Plus, X, FolderGit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function SessionTabs() {
  const { sessions, activeSessionId, setActiveSession } = useSessionStore()
  const { setShowNewSessionDialog, setShowCloseSessionDialog, setShowManageWorktreesDialog } =
    useUiStore()

  return (
    <header className="drag-region flex h-12 items-center gap-1 border-b bg-muted/30 px-2">
      {/* Spacer for macOS traffic lights */}
      <div className="w-16 flex-shrink-0" />

      {/* Session tabs */}
      <div className="no-drag flex flex-1 items-center gap-1 overflow-x-auto">
        {sessions.map((session) => (
          <SessionTab
            key={session.id}
            session={session}
            isActive={session.id === activeSessionId}
            onClick={() => setActiveSession(session.id)}
            onClose={() => {
              setActiveSession(session.id)
              setShowCloseSessionDialog(true)
            }}
          />
        ))}

        {/* New session button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setShowNewSessionDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Session</TooltipContent>
        </Tooltip>
      </div>

      {/* Right side actions */}
      <div className="no-drag flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowManageWorktreesDialog(true)}
            >
              <FolderGit2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manage Worktrees</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}

interface SessionTabProps {
  session: {
    id: string
    name: string
    isGitRepo: boolean
    agent: string
  }
  isActive: boolean
  onClick: () => void
  onClose: () => void
}

function SessionTab({ session, isActive, onClick, onClose }: SessionTabProps) {
  return (
    <div
      className={cn(
        'group flex max-w-48 cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 transition-colors',
        isActive ? 'bg-background shadow-sm' : 'hover:bg-muted'
      )}
      onClick={onClick}
    >
      <span className="flex-1 truncate text-sm">{session.name}</span>
      {!session.isGitRepo && (
        <span className="text-xs text-yellow-500" title="Not a git repo">
          !
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
