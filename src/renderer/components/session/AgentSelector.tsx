import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AgentType } from '@shared/types'
import { AGENT_CONFIGS } from '@shared/types'

interface AgentSelectorProps {
  value: AgentType
  onChange: (value: AgentType) => void
  disabled?: boolean
}

export function AgentSelector({ value, onChange, disabled }: AgentSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AgentType)} disabled={disabled}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select agent" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(AGENT_CONFIGS).map(([key, config]) => (
          <SelectItem
            key={key}
            value={key}
            disabled={!config.available}
          >
            {config.name} {!config.available && '(Soon)'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
