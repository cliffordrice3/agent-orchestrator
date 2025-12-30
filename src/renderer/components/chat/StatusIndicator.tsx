import { Loader2, MessageSquare, Terminal, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TerminalState } from '@shared/types'

interface StatusIndicatorProps {
  state: TerminalState | undefined
}

export function StatusIndicator({ state }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    if (!state) {
      return {
        icon: Circle,
        label: 'Idle',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted-foreground/20',
        animate: false,
      }
    }

    switch (state.type) {
      case 'thinking':
        return {
          icon: Loader2,
          label: 'Thinking',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          animate: true,
        }
      case 'tool_use':
        return {
          icon: Terminal,
          label: state.tool ? `Running: ${state.tool}` : 'Running tool',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          animate: true,
        }
      case 'waiting_input':
        return {
          icon: MessageSquare,
          label: state.subtype === 'confirmation' ? 'Awaiting confirmation' : 'Ready for input',
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          animate: false,
        }
      case 'idle':
      default:
        return {
          icon: Circle,
          label: 'Idle',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted-foreground/20',
          animate: false,
        }
    }
  }

  const { icon: Icon, label, color, bgColor, animate } = getStatusConfig()

  return (
    <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs', bgColor)}>
      <Icon className={cn('h-3 w-3', color, animate && 'animate-spin')} />
      <span className={color}>{label}</span>
    </div>
  )
}
