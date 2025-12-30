import { useMemo } from 'react'
import { Plus, ChevronDown, ChevronRight, FolderGit2, X, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import type { Session, TerminalState } from '@shared/types'

interface WorkspaceGroup {
  repoPath: string
  name: string
  sessions: Session[]
  isExpanded: boolean
}

export function Sidebar() {
  const { sessions, activeSessionId, setActiveSession } = useSessionStore()
  const terminalStates = useSessionStore((state) => state.terminalStates)
  const {
    setShowNewSessionDialog,
    setShowCloseSessionDialog,
    setShowManageWorktreesDialog,
    expandedWorkspaces,
    toggleWorkspaceExpanded,
  } = useUiStore()

  // Group sessions by repoPath
  const workspaceGroups = useMemo(() => {
    const groups = new Map<string, Session[]>()

    for (const session of sessions) {
      const existing = groups.get(session.repoPath) || []
      groups.set(session.repoPath, [...existing, session])
    }

    return Array.from(groups.entries()).map(([repoPath, groupSessions]) => ({
      repoPath,
      name: repoPath.split('/').pop() || repoPath,
      sessions: groupSessions.sort((a, b) => a.createdAt - b.createdAt),
      isExpanded: expandedWorkspaces[repoPath] !== false, // Default to expanded
    }))
  }, [sessions, expandedWorkspaces])

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Header with drag region for macOS */}
      <div className="drag-region flex h-12 items-center justify-between border-b px-3">
        {/* Spacer for macOS traffic lights */}
        <div className="w-16 flex-shrink-0" />
        <div className="no-drag flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowNewSessionDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Session</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Workspaces list */}
      <div className="flex-1 overflow-y-auto py-2">
        {workspaceGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No sessions yet</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setShowNewSessionDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>
        ) : (
          workspaceGroups.map((group) => (
            <WorkspaceGroupItem
              key={group.repoPath}
              group={group}
              activeSessionId={activeSessionId}
              terminalStates={terminalStates}
              onSessionClick={setActiveSession}
              onSessionClose={(sessionId) => {
                setActiveSession(sessionId)
                setShowCloseSessionDialog(true)
              }}
              onToggleExpand={() => toggleWorkspaceExpanded(group.repoPath)}
            />
          ))
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setShowManageWorktreesDialog(true)}
        >
          <FolderGit2 className="mr-2 h-4 w-4" />
          Manage Worktrees
        </Button>
      </div>
    </aside>
  )
}

interface WorkspaceGroupItemProps {
  group: WorkspaceGroup
  activeSessionId: string | null
  terminalStates: Record<string, TerminalState>
  onSessionClick: (sessionId: string) => void
  onSessionClose: (sessionId: string) => void
  onToggleExpand: () => void
}

function WorkspaceGroupItem({
  group,
  activeSessionId,
  terminalStates,
  onSessionClick,
  onSessionClose,
  onToggleExpand,
}: WorkspaceGroupItemProps) {
  const hasActiveSession = group.sessions.some((s) => s.id === activeSessionId)

  return (
    <div className="mb-1">
      {/* Workspace header */}
      <button
        className={cn(
          'flex w-full items-center gap-1 px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50',
          hasActiveSession && 'bg-muted/30'
        )}
        onClick={onToggleExpand}
      >
        {group.isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <FolderGit2 className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 truncate font-medium">{group.name}</span>
        <span className="text-xs text-muted-foreground">{group.sessions.length}</span>
      </button>

      {/* Sessions list */}
      {group.isExpanded && (
        <div className="ml-4 border-l pl-2">
          {group.sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              terminalState={terminalStates[session.id]}
              onClick={() => onSessionClick(session.id)}
              onClose={() => onSessionClose(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SessionItemProps {
  session: Session
  isActive: boolean
  terminalState?: TerminalState
  onClick: () => void
  onClose: () => void
}

function SessionItem({ session, isActive, terminalState, onClick, onClose }: SessionItemProps) {
  return (
    <div
      className={cn(
        'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
      onClick={onClick}
    >
      <SessionStatusIndicator state={terminalState} />
      <span className="flex-1 truncate">{session.name}</span>
      {!session.isGitRepo && (
        <span className="text-xs text-yellow-500" title="Not a git repo">
          !
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            Close Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function SessionStatusIndicator({ state }: { state?: TerminalState }) {
  const getStatusColor = () => {
    if (!state) return 'bg-muted-foreground/50'
    switch (state.type) {
      case 'thinking':
        return 'bg-yellow-500 animate-pulse'
      case 'tool_use':
        return 'bg-blue-500 animate-pulse'
      case 'waiting_input':
        return 'bg-green-500'
      default:
        return 'bg-muted-foreground/50'
    }
  }

  return <div className={cn('h-2 w-2 rounded-full', getStatusColor())} />
}
