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
  const { loadSessions, sessions, activeSessionId, appendTerminalOutput } = useSessionStore()

  useEffect(() => {
    // Load existing sessions on mount
    loadSessions()

    // Set up terminal output listener
    const unsubscribeOutput = api.onTerminalOutput((sessionId, data) => {
      appendTerminalOutput(sessionId, data)
    })

    const unsubscribeExit = api.onTerminalExit((sessionId, code) => {
      console.log(`Terminal ${sessionId} exited with code ${code}`)
    })

    return () => {
      unsubscribeOutput()
      unsubscribeExit()
    }
  }, [loadSessions, appendTerminalOutput])

  const activeSession = sessions.find(s => s.id === activeSessionId)

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background text-foreground">
        {/* Header with session tabs */}
        <SessionTabs />

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {activeSession ? (
            <SessionPanel session={activeSession} />
          ) : (
            <EmptyState />
          )}
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
  const { setShowNewSessionDialog } = useUiStore()

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-muted-foreground">No Active Sessions</h2>
        <p className="text-muted-foreground">
          Create a new session to start working with an AI coding agent
        </p>
        <button
          onClick={() => setShowNewSessionDialog(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create New Session
        </button>
      </div>
    </div>
  )
}
