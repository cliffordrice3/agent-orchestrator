import { Check, Plus, Minus, Edit, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSessionStore } from '@/stores/sessionStore'
import { cn } from '@/lib/utils'
import type { FileChange } from '@shared/types'

interface FileTreeProps {
  sessionId: string
  files: FileChange[]
  selectedFile: string | null
  onSelectFile: (path: string) => void
}

export function FileTree({ sessionId, files, selectedFile, onSelectFile }: FileTreeProps) {
  const { isFileReviewed, markFileReviewed, unmarkFileReviewed } = useSessionStore()

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No changes detected
      </div>
    )
  }

  function getStatusIcon(status: FileChange['status']) {
    switch (status) {
      case 'added':
      case 'untracked':
        return <Plus className="h-3 w-3 text-green-500" />
      case 'deleted':
        return <Minus className="h-3 w-3 text-red-500" />
      case 'modified':
        return <Edit className="h-3 w-3 text-yellow-500" />
      case 'renamed':
        return <FileQuestion className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  function getStatusColor(status: FileChange['status']) {
    switch (status) {
      case 'added':
      case 'untracked':
        return 'text-green-500'
      case 'deleted':
        return 'text-red-500'
      case 'modified':
        return 'text-yellow-500'
      case 'renamed':
        return 'text-blue-500'
      default:
        return ''
    }
  }

  function toggleReview(e: React.MouseEvent, filePath: string) {
    e.stopPropagation()
    if (isFileReviewed(sessionId, filePath)) {
      unmarkFileReviewed(sessionId, filePath)
    } else {
      markFileReviewed(sessionId, filePath)
    }
  }

  return (
    <div className="py-1">
      {files.map((file) => {
        const isSelected = file.path === selectedFile
        const reviewed = isFileReviewed(sessionId, file.path)

        return (
          <div
            key={file.path}
            className={cn(
              'group flex items-center gap-2 px-3 py-1 cursor-pointer transition-colors',
              isSelected ? 'bg-accent' : 'hover:bg-muted/50',
              reviewed && 'opacity-60'
            )}
            onClick={() => onSelectFile(file.path)}
          >
            {/* Status icon */}
            <span className="flex-shrink-0">
              {getStatusIcon(file.status)}
            </span>

            {/* File path */}
            <span
              className={cn(
                'text-sm truncate flex-1',
                getStatusColor(file.status)
              )}
              title={file.path}
            >
              {file.path}
            </span>

            {/* Review toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    reviewed
                      ? 'text-green-500 opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={(e) => toggleReview(e, file.path)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {reviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
              </TooltipContent>
            </Tooltip>
          </div>
        )
      })}
    </div>
  )
}
