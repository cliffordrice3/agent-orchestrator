import { useRef, useEffect, useState } from 'react'
import { Send, RotateCcw, CheckCircle, XCircle, FileEdit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TerminalOutput } from './TerminalOutput'
import { useSessionStore } from '@/stores/sessionStore'
import { api } from '@/lib/ipc'
import type { Session } from '@shared/types'

interface ChatInterfaceProps {
  session: Session
}

export function ChatInterface({ session }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const terminalOutput = useSessionStore((state) => state.terminalOutputs[session.id] || '')

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [session.id])

  function handleSend() {
    if (!input.trim()) return
    api.sendInput(session.id, input + '\n')
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Control commands
  function sendControlCommand(cmd: string) {
    api.sendInput(session.id, cmd)
  }

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

        {/* Control buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => sendControlCommand('/plan\n')}
              >
                <FileEdit className="mr-1 h-3 w-3" />
                Plan
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle plan mode</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-500 hover:text-green-400"
                onClick={() => sendControlCommand('y\n')}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Accept
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accept changes (y)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-500 hover:text-red-400"
                onClick={() => sendControlCommand('n\n')}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Reject
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reject changes (n)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => useSessionStore.getState().clearTerminalOutput(session.id)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear output</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Terminal output */}
      <div className="flex-1 overflow-hidden">
        <TerminalOutput sessionId={session.id} output={terminalOutput} />
      </div>

      {/* Input area */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="max-h-32 min-h-[60px] flex-1 resize-none rounded-md border bg-background p-3 focus:outline-none focus:ring-2 focus:ring-ring"
            rows={2}
          />
          <Button onClick={handleSend} disabled={!input.trim()} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
