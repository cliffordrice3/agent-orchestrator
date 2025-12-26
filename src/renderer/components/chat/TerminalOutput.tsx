import { useRef, useEffect } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { api } from '@/lib/ipc'

interface TerminalOutputProps {
  sessionId: string
  output: string
}

export function TerminalOutput({ sessionId, output }: TerminalOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const lastOutputLengthRef = useRef(0)

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current) return

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
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
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
      api.resizeTerminal(sessionId, cols, rows)
    })
    resizeObserver.observe(containerRef.current)

    // Handle user input (direct typing in terminal)
    terminal.onData((data) => {
      api.sendInput(sessionId, data)
    })

    return () => {
      resizeObserver.disconnect()
      terminal.dispose()
    }
  }, [sessionId])

  // Update terminal with new output
  useEffect(() => {
    if (!terminalRef.current) return

    // Only write new content
    if (output.length > lastOutputLengthRef.current) {
      const newContent = output.slice(lastOutputLengthRef.current)
      terminalRef.current.write(newContent)
    } else if (output.length < lastOutputLengthRef.current) {
      // Output was cleared, reset terminal
      terminalRef.current.clear()
      if (output.length > 0) {
        terminalRef.current.write(output)
      }
    }

    lastOutputLengthRef.current = output.length
  }, [output])

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-[#0a0a0a]"
      style={{ padding: '8px' }}
    />
  )
}
