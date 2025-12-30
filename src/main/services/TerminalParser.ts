/* eslint-disable no-control-regex */
import type { TerminalState } from '../../shared/types'

// ANSI escape code regex - matches all ANSI sequences
const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[()][AB012]|\x1b[=>]/g

// Patterns for detecting Claude Code states
const PATTERNS = {
  // Input prompts - indicates turn complete and waiting for user
  inputPrompt: /^>\s*$/m,
  userPrompt: /^You:\s*$/m,

  // Permission/confirmation prompts
  confirmPrompt: /\(y\/n\)/i,
  allowPrompt: /Allow\?/i,
  continuePrompt: /Press Enter to continue/i,

  // Thinking indicators
  thinking: /Thinking\.\.\./i,
  reasoning: /Reasoning\.\.\./i,

  // Tool use patterns
  readingFile: /Reading\s+(?:file\s+)?["']?([^"'\n]+)["']?/i,
  writingFile: /Writing\s+(?:to\s+)?["']?([^"'\n]+)["']?/i,
  editingFile: /Editing\s+["']?([^"'\n]+)["']?/i,
  runningCommand: /Running\s+(?:command\s+)?[`"']?([^`"'\n]+)[`"']?/i,
  searchingFiles: /Searching|Grep|Glob/i,
  bashCommand: /Bash\s*\(/i,

  // Status line (Claude Code uses OSC sequences for status)
  statusLine: /\x1b\]0;([^\x07]*)\x07/,
}

export class TerminalParser {
  private currentState: TerminalState = {
    type: 'idle',
    timestamp: Date.now(),
  }
  private outputBuffer = ''
  private lastToolUse: string | null = null

  /**
   * Strip ANSI escape codes from text for pattern matching
   */
  private stripAnsi(text: string): string {
    return text.replace(ANSI_REGEX, '')
  }

  /**
   * Parse terminal output and detect state changes
   */
  parse(data: string): TerminalState | null {
    // Accumulate output for context
    this.outputBuffer += data
    // Keep buffer manageable - last 2000 chars
    if (this.outputBuffer.length > 2000) {
      this.outputBuffer = this.outputBuffer.slice(-2000)
    }

    const cleanData = this.stripAnsi(data)
    const cleanBuffer = this.stripAnsi(this.outputBuffer)

    let newState: TerminalState | null = null

    // Check for input prompt (turn complete)
    if (
      PATTERNS.inputPrompt.test(cleanData) ||
      PATTERNS.userPrompt.test(cleanData) ||
      cleanBuffer.trimEnd().endsWith('>')
    ) {
      // Check if it's a confirmation prompt
      if (
        PATTERNS.confirmPrompt.test(cleanBuffer) ||
        PATTERNS.allowPrompt.test(cleanBuffer) ||
        PATTERNS.continuePrompt.test(cleanBuffer)
      ) {
        newState = {
          type: 'waiting_input',
          subtype: 'confirmation',
          timestamp: Date.now(),
        }
      } else {
        newState = {
          type: 'waiting_input',
          subtype: 'prompt',
          timestamp: Date.now(),
        }
      }
    }
    // Check for thinking state
    else if (PATTERNS.thinking.test(cleanData) || PATTERNS.reasoning.test(cleanData)) {
      newState = {
        type: 'thinking',
        timestamp: Date.now(),
      }
    }
    // Check for tool use
    else if (this.detectToolUse(cleanData)) {
      newState = {
        type: 'tool_use',
        tool: this.lastToolUse || undefined,
        timestamp: Date.now(),
      }
    }

    // Only emit if state actually changed
    if (newState && !this.statesEqual(newState, this.currentState)) {
      this.currentState = newState
      return newState
    }

    return null
  }

  /**
   * Detect tool use patterns
   */
  private detectToolUse(text: string): boolean {
    const toolPatterns: [RegExp, string][] = [
      [PATTERNS.readingFile, 'read'],
      [PATTERNS.writingFile, 'write'],
      [PATTERNS.editingFile, 'edit'],
      [PATTERNS.runningCommand, 'bash'],
      [PATTERNS.bashCommand, 'bash'],
      [PATTERNS.searchingFiles, 'search'],
    ]

    for (const [pattern, tool] of toolPatterns) {
      if (pattern.test(text)) {
        this.lastToolUse = tool
        return true
      }
    }

    return false
  }

  /**
   * Compare two states for equality
   */
  private statesEqual(a: TerminalState, b: TerminalState): boolean {
    return a.type === b.type && a.subtype === b.subtype && a.tool === b.tool
  }

  /**
   * Get the current state
   */
  getCurrentState(): TerminalState {
    return this.currentState
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.currentState = { type: 'idle', timestamp: Date.now() }
    this.outputBuffer = ''
    this.lastToolUse = null
  }
}

// Map of session ID to parser instance
const parsers = new Map<string, TerminalParser>()

export function getParser(sessionId: string): TerminalParser {
  let parser = parsers.get(sessionId)
  if (!parser) {
    parser = new TerminalParser()
    parsers.set(sessionId, parser)
  }
  return parser
}

export function removeParser(sessionId: string): void {
  parsers.delete(sessionId)
}
