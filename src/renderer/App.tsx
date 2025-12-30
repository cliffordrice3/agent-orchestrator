import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionTabs } from '@/components/layout/SessionTabs'
import { SessionPanel } from '@/components/session/SessionPanel'
import { NewSessionDialog } from '@/components/session/NewSessionDialog'
import { CloseSessionDialog } from '@/components/session/CloseSessionDialog'
import { ManageWorktreesDialog } from '@/components/session/ManageWorktreesDialog'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { api } from '@/lib/ipc'

export default function App() {
  const {
    loadSessions,
    sessions,
    activeSessionId,
    appendTerminalOutput,
    setTerminalState,
    isLoading,
  } = useSessionStore()
  const { setShowNewSessionDialog } = useUiStore()

  useEffect(() => {
    loadSessions()

    const unsubscribeOutput = api.onTerminalOutput((sessionId, data) => {
      appendTerminalOutput(sessionId, data)
    })

    const unsubscribeExit = api.onTerminalExit((_sessionId, _code) => {
      // Terminal exited
    })

    const unsubscribeState = api.onTerminalState((sessionId, state) => {
      setTerminalState(sessionId, state)
    })

    return () => {
      unsubscribeOutput()
      unsubscribeExit()
      unsubscribeState()
    }
  }, [loadSessions, appendTerminalOutput, setTerminalState])

  // Auto-open new session dialog when no sessions exist
  useEffect(() => {
    if (!isLoading && sessions.length === 0) {
      setShowNewSessionDialog(true)
    }
  }, [isLoading, sessions.length, setShowNewSessionDialog])

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background text-foreground">
        {/* Header with session tabs */}
        <SessionTabs />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {activeSession ? <SessionPanel session={activeSession} /> : <EmptyState />}
        </main>

        {/* Dialogs */}
        <NewSessionDialog />
        <CloseSessionDialog />
        <ManageWorktreesDialog />
      </div>
    </TooltipProvider>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">No active sessions</p>
    </div>
  )
}
