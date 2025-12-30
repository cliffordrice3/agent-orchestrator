import { TerminalOutput } from './TerminalOutput'
import { StatusIndicator } from './StatusIndicator'
import { useSessionStore } from '@/stores/sessionStore'
import type { Session } from '@shared/types'

interface ChatInterfaceProps {
  session: Session
}

export function ChatInterface({ session }: ChatInterfaceProps) {
  const terminalOutput = useSessionStore((state) => state.terminalOutputs[session.id] || '')
  const terminalState = useSessionStore((state) => state.terminalStates[session.id])

  return (
    <div className="flex h-full flex-col">
      {/* Session info bar */}
      <div className="flex h-10 items-center justify-between border-b bg-muted/30 px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{session.name}</span>
          {session.isGitRepo && (
            <>
              <span>/</span>
              <span>{session.branch}</span>
              <span className="text-xs">({session.baseBranch})</span>
            </>
          )}
        </div>
        <StatusIndicator state={terminalState} />
      </div>

      {/* Terminal */}
      <div className="flex-1 overflow-hidden">
        <TerminalOutput sessionId={session.id} output={terminalOutput} />
      </div>
    </div>
  )
}
