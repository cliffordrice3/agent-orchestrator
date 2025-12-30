import { useState, useEffect } from 'react'
import { Folder, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { api } from '@/lib/ipc'
import type { AgentType } from '@shared/types'
import { AGENT_CONFIGS } from '@shared/types'

export function NewSessionDialog() {
  const { showNewSessionDialog, setShowNewSessionDialog, lastSessionConfig, setLastSessionConfig } =
    useUiStore()
  const { createSession } = useSessionStore()

  const [folderPath, setFolderPath] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [isGitRepo, setIsGitRepo] = useState<boolean | null>(null)
  const [branches, setBranches] = useState<string[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('claude-code')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load last config when dialog opens
  useEffect(() => {
    if (showNewSessionDialog && lastSessionConfig) {
      setFolderPath(lastSessionConfig.folderPath)
      setSelectedAgent(lastSessionConfig.agent)
      // Derive session name from folder
      const folderName = lastSessionConfig.folderPath.split('/').pop() || 'New Session'
      setSessionName(folderName)
    }
  }, [showNewSessionDialog, lastSessionConfig])

  // Reset state when dialog closes
  useEffect(() => {
    if (!showNewSessionDialog) {
      setFolderPath('')
      setSessionName('')
      setIsGitRepo(null)
      setBranches([])
      setSelectedBranch('')
      setSelectedAgent('claude-code')
      setError(null)
    }
  }, [showNewSessionDialog])

  // Check if folder is a git repo when path changes
  useEffect(() => {
    async function checkGitRepo() {
      if (!folderPath) {
        setIsGitRepo(null)
        setBranches([])
        return
      }

      try {
        const isRepo = await api.isGitRepo(folderPath)
        setIsGitRepo(isRepo)

        if (isRepo) {
          const branchList = await api.getBranches(folderPath)
          setBranches(branchList)
          if (branchList.length > 0) {
            // Default to main or master if available
            const defaultBranch =
              branchList.find((b) => b === 'main' || b === 'master') || branchList[0]
            setSelectedBranch(defaultBranch)
          }
        }
      } catch (err) {
        console.error('Error checking git repo:', err)
        setIsGitRepo(false)
      }
    }

    checkGitRepo()
  }, [folderPath])

  async function handleSelectFolder() {
    const path = await api.selectFolder()
    if (path) {
      setFolderPath(path)
      // Use folder name as default session name
      const folderName = path.split('/').pop() || 'New Session'
      setSessionName(folderName)
    }
  }

  async function handleCreate() {
    if (!folderPath) {
      setError('Please select a folder')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await createSession({
        repoPath: folderPath,
        name: sessionName || 'New Session',
        branch: selectedBranch,
        agent: selectedAgent,
      })

      // Save config for next time
      setLastSessionConfig({
        folderPath,
        agent: selectedAgent,
      })

      setShowNewSessionDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>
            Create a new agent session. Select a folder to work in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Folder selection */}
          <div className="grid gap-2">
            <Label htmlFor="folder">Working Directory</Label>
            <div className="flex gap-2">
              <Input
                id="folder"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="Select a folder..."
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectFolder}>
                <Folder className="h-4 w-4" />
              </Button>
            </div>
            {isGitRepo === false && folderPath && (
              <p className="flex items-center gap-1 text-sm text-yellow-500">
                <AlertCircle className="h-3 w-3" />
                Not a git repository. Parallel agents not supported.
              </p>
            )}
          </div>

          {/* Session name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Session Name</Label>
            <Input
              id="name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="My Session"
            />
          </div>

          {/* Branch selection (only for git repos) */}
          {isGitRepo && branches.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="branch">Base Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                A new worktree will be created from this branch.
              </p>
            </div>
          )}

          {/* Agent selection */}
          <div className="grid gap-2">
            <Label htmlFor="agent">Agent</Label>
            <Select value={selectedAgent} onValueChange={(v) => setSelectedAgent(v as AgentType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGENT_CONFIGS).map(([key, config]) => (
                  <SelectItem key={key} value={key} disabled={!config.available}>
                    {config.name} {!config.available && '(Coming Soon)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !folderPath}>
            {isLoading ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
