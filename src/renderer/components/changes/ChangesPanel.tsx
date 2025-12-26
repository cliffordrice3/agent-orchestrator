import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, PanelLeftClose, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FileTree } from './FileTree'
import { DiffViewer } from './DiffViewer'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { api } from '@/lib/ipc'
import type { Session } from '@shared/types'

interface ChangesPanelProps {
  session: Session
  onClose: () => void
}

export function ChangesPanel({ session, onClose }: ChangesPanelProps) {
  const { gitStatuses, refreshGitStatus, isFileReviewed } = useSessionStore()
  const { selectedFileForDiff, setSelectedFileForDiff } = useUiStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showReviewedFiles, setShowReviewedFiles] = useState(false)

  const status = gitStatuses[session.id]

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await refreshGitStatus(session.id)
    } finally {
      setIsLoading(false)
    }
  }, [refreshGitStatus, session.id])

  useEffect(() => {
    handleRefresh()
  }, [handleRefresh])

  async function handleOpenInVSCode() {
    const workingDir = session.worktreePath || session.repoPath
    const filesToOpen = selectedFileForDiff ? [selectedFileForDiff] : []
    await api.openInVSCode(workingDir, filesToOpen)
  }

  // Filter files based on showReviewedFiles toggle
  const files = status?.files || []
  const unreviewedFiles = files.filter((f) => !isFileReviewed(session.id, f.path))
  const displayedFiles = showReviewedFiles ? files : unreviewedFiles

  const reviewedCount = files.filter((f) => isFileReviewed(session.id, f.path)).length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b bg-muted/30 px-3">
        <span className="text-sm font-medium">Changes</span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowReviewedFiles(!showReviewedFiles)}
              >
                {showReviewedFiles ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showReviewedFiles ? 'Hide reviewed files' : 'Show reviewed files'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenInVSCode}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in VS Code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hide panel</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <span>{files.length} changed files</span>
        {reviewedCount > 0 && (
          <span className="ml-2 text-green-500">({reviewedCount} reviewed)</span>
        )}
      </div>

      {/* File list */}
      <div className="max-h-48 flex-shrink-0 overflow-hidden border-b">
        <ScrollArea className="h-full">
          <FileTree
            sessionId={session.id}
            files={displayedFiles}
            selectedFile={selectedFileForDiff}
            onSelectFile={setSelectedFileForDiff}
          />
        </ScrollArea>
      </div>

      {/* Diff viewer */}
      <div className="min-h-0 flex-1">
        {selectedFileForDiff ? (
          <DiffViewer sessionId={session.id} filePath={selectedFileForDiff} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a file to view diff
          </div>
        )}
      </div>
    </div>
  )
}
