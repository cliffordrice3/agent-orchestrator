import { useState } from 'react'
import { PanelLeftClose, PanelRightClose, AlertTriangle } from 'lucide-react'
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
    <div className="h-full flex flex-col">
      {/* Warning banner for non-git repos */}
      {!session.isGitRepo && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-500">
            This folder is not a git repository. Parallel agents and change tracking are not supported.
          </span>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat section */}
        <div className={cn('flex-1 flex flex-col min-w-0', showChanges && 'border-r')}>
          <ChatInterface session={session} />
        </div>

        {/* Changes panel (collapsible) */}
        {session.isGitRepo && showChanges && (
          <div className="w-96 flex-shrink-0 flex flex-col">
            <ChangesPanel session={session} onClose={() => setShowChanges(false)} />
          </div>
        )}

        {/* Toggle changes panel button */}
        {session.isGitRepo && !showChanges && (
          <div className="border-l flex items-start py-2">
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
