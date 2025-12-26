import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSessionStore } from '@/stores/sessionStore'
import { cn } from '@/lib/utils'

interface StagedChangesProps {
  sessionId: string
}

export function StagedChanges({ sessionId }: StagedChangesProps) {
  const { reviewedFiles, unmarkFileReviewed, clearReviewedFiles } = useSessionStore()

  const reviewed = Array.from(reviewedFiles[sessionId] || new Set())

  if (reviewed.length === 0) {
    return null
  }

  return (
    <div className="border-t">
      <div className="px-3 py-2 flex items-center justify-between bg-muted/20">
        <span className="text-xs font-medium text-muted-foreground">
          Reviewed Files ({reviewed.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => clearReviewedFiles(sessionId)}
        >
          Clear All
        </Button>
      </div>

      <ScrollArea className="max-h-32">
        <div className="py-1">
          {reviewed.map((filePath) => (
            <div
              key={filePath}
              className="flex items-center gap-2 px-3 py-1 text-sm text-muted-foreground"
            >
              <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="truncate flex-1">{filePath}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 flex-shrink-0"
                onClick={() => unmarkFileReviewed(sessionId, filePath)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
