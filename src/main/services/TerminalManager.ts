import * as pty from 'node-pty'
import type { BrowserWindow } from 'electron'
import type { Session, AGENT_CONFIGS } from '../../shared/types'
import { getParser, removeParser } from './TerminalParser'

interface TerminalInstance {
  pty: pty.IPty
  sessionId: string
}

const agentConfigs: typeof AGENT_CONFIGS = {
  'claude-code': {
    name: 'Claude Code',
    command: 'claude',
    args: [],
    available: true,
  },
  codex: {
    name: 'Codex',
    command: 'codex',
    args: [],
    available: false,
  },
  cursor: {
    name: 'Cursor',
    command: 'cursor',
    args: ['--chat'],
    available: false,
  },
}

export class TerminalManager {
  private terminals: Map<string, TerminalInstance> = new Map()
  private mainWindow: BrowserWindow | null = null

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  async createTerminal(session: Session): Promise<void> {
    const workingDir = session.worktreePath || session.repoPath
    const agentConfig = agentConfigs[session.agent]

    if (!agentConfig.available) {
      throw new Error(`Agent ${agentConfig.name} is not yet available`)
    }

    // Determine shell based on platform
    const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'

    // Spawn the PTY
    const terminal = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: workingDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    })

    // Store the terminal instance
    this.terminals.set(session.id, {
      pty: terminal,
      sessionId: session.id,
    })

    // Set up data handler with event parsing
    const parser = getParser(session.id)
    terminal.onData((data) => {
      this.mainWindow?.webContents.send('terminal:output', session.id, data)

      // Parse for state changes
      const stateChange = parser.parse(data)
      if (stateChange) {
        this.mainWindow?.webContents.send('terminal:state', session.id, stateChange)
      }
    })

    // Set up exit handler
    terminal.onExit(({ exitCode }) => {
      this.mainWindow?.webContents.send('terminal:exit', session.id, exitCode)
      this.terminals.delete(session.id)
    })

    // Start the agent after a small delay to let shell initialize
    setTimeout(() => {
      const command = `${agentConfig.command} ${agentConfig.args.join(' ')}\r`
      terminal.write(command)
    }, 500)
  }

  sendInput(sessionId: string, data: string): void {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      terminal.pty.write(data)
    }
  }

  resizeTerminal(sessionId: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      terminal.pty.resize(cols, rows)
    }
  }

  closeTerminal(sessionId: string): void {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      terminal.pty.kill()
      this.terminals.delete(sessionId)
      removeParser(sessionId)
    }
  }

  closeAllTerminals(): void {
    for (const [sessionId] of this.terminals) {
      this.closeTerminal(sessionId)
    }
  }
}

export const terminalManager = new TerminalManager()
