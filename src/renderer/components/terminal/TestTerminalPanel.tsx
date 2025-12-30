import { useRef, useEffect, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { X, Play, Square, ChevronDown, ChevronUp, TerminalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUiStore } from '@/stores/uiStore'
import { useSessionStore } from '@/stores/sessionStore'
import { api } from '@/lib/ipc'
import { cn } from '@/lib/utils'
import '@xterm/xterm/css/xterm.css'

const TERMINAL_ID = 'test-terminal'

export function TestTerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [command, setCommand] = useState('npm test')
  const [isMinimized, setIsMinimized] = useState(false)
  const [output, setOutput] = useState('')
  const outputRef = useRef('')

  const { setShowTestTerminal } = useUiStore()
  const { sessions, activeSessionId } = useSessionStore()

  // Get working directory from active session
  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const workingDir = activeSession?.worktreePath || activeSession?.repoPath || process.cwd()

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current || isMinimized) return

    const terminal = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#e4e4e7',
        cursor: '#e4e4e7',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#3f3f46',
        black: '#18181b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e7',
        brightBlack: '#52525b',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#fafafa',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      const { cols, rows } = terminal
      api.resizeStandaloneTerminal(TERMINAL_ID, cols, rows)
    })
    resizeObserver.observe(containerRef.current)

    // Handle user input
    terminal.onData((data) => {
      if (isRunning) {
        api.sendStandaloneInput(TERMINAL_ID, data)
      }
    })

    // Write existing output
    if (output) {
      terminal.write(output)
    }

    return () => {
      resizeObserver.disconnect()
      terminal.dispose()
    }
    // We intentionally only re-render when isMinimized changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMinimized])

  // Handle terminal output
  useEffect(() => {
    const unsubscribeOutput = api.onStandaloneOutput((id, data) => {
      if (id === TERMINAL_ID) {
        outputRef.current += data
        setOutput(outputRef.current)
        terminalRef.current?.write(data)
      }
    })

    const unsubscribeExit = api.onStandaloneExit((id, _code) => {
      if (id === TERMINAL_ID) {
        setIsRunning(false)
      }
    })

    return () => {
      unsubscribeOutput()
      unsubscribeExit()
    }
  }, [])

  const handleRun = async () => {
    if (!command.trim()) return

    // Clear terminal
    terminalRef.current?.clear()
    outputRef.current = ''
    setOutput('')

    // Create terminal and run command
    await api.createStandaloneTerminal(TERMINAL_ID, workingDir)
    setIsRunning(true)

    // Send the command after a small delay
    setTimeout(() => {
      api.sendStandaloneInput(TERMINAL_ID, command + '\r')
    }, 100)
  }

  const handleStop = () => {
    // Send Ctrl+C
    api.sendStandaloneInput(TERMINAL_ID, '\x03')
    setTimeout(() => {
      api.closeStandaloneTerminal(TERMINAL_ID)
      setIsRunning(false)
    }, 100)
  }

  const handleClose = () => {
    if (isRunning) {
      api.closeStandaloneTerminal(TERMINAL_ID)
    }
    setShowTestTerminal(false)
  }

  return (
    <div
      className={cn(
        'flex flex-col border-t bg-background transition-all',
        isMinimized ? 'h-10' : 'h-64'
      )}
    >
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b bg-muted/30 px-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Terminal</span>
          {activeSession && (
            <span className="text-xs text-muted-foreground">({activeSession.name})</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Command input */}
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              if (!isRunning) handleRun()
            }}
          >
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npm test"
              className="h-7 w-48 text-xs"
              disabled={isRunning}
            />
            {isRunning ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={handleStop}
                  >
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-500"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run</TooltipContent>
              </Tooltip>
            )}
          </form>

          <div className="mx-2 h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMinimized ? 'Expand' : 'Minimize'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close Terminal</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Terminal content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="h-full w-full bg-[#0a0a0a]"
            style={{ padding: '8px' }}
          />
        </div>
      )}
    </div>
  )
}
