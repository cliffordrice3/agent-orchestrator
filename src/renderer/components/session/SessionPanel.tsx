import { useState } from 'react'
import { PanelRightClose, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ChangesPanel } from '@/components/changes/ChangesPanel'
import type { Session } from '@shared/types'
import { cn } from '@/lib/utils'

interface SessionPanelProps {
  session: Session
}

export function SessionPanel({ session }: SessionPanelProps) {
  const [showChanges, setShowChanges] = useState(true)

  return (
    <div className="flex h-full flex-col">
      {/* Warning banner for non-git repos */}
      {!session.isGitRepo && (
        <div className="flex items-center gap-2 border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-500">
            This folder is not a git repository. Parallel agents and change tracking are not
            supported.
          </span>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat section */}
        <div className={cn('flex min-w-0 flex-1 flex-col', showChanges && 'border-r')}>
          <ChatInterface session={session} />
        </div>

        {/* Changes panel (collapsible) */}
        {session.isGitRepo && showChanges && (
          <div className="flex w-96 flex-shrink-0 flex-col">
            <ChangesPanel session={session} onClose={() => setShowChanges(false)} />
          </div>
        )}

        {/* Toggle changes panel button */}
        {session.isGitRepo && !showChanges && (
          <div className="flex items-start border-l py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowChanges(true)}
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Show Changes</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
