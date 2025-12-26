import { useEffect, useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/ipc'

interface DiffViewerProps {
  sessionId: string
  filePath: string
}

export function DiffViewer({ sessionId, filePath }: DiffViewerProps) {
  const [originalContent, setOriginalContent] = useState('')
  const [modifiedContent, setModifiedContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDiff() {
      setIsLoading(true)
      setError(null)

      try {
        const [original, modified] = await Promise.all([
          api.getOriginalFileContent(sessionId, filePath),
          api.getFileContent(sessionId, filePath)
        ])

        setOriginalContent(original)
        setModifiedContent(modified)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load diff')
      } finally {
        setIsLoading(false)
      }
    }

    loadDiff()
  }, [sessionId, filePath])

  // Detect language from file extension
  function getLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      rb: 'ruby',
      rs: 'rust',
      go: 'go',
      java: 'java',
      kt: 'kotlin',
      swift: 'swift',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      hpp: 'cpp',
      cs: 'csharp',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell',
      bash: 'shell',
      zsh: 'shell',
      dockerfile: 'dockerfile',
      vue: 'vue',
      svelte: 'svelte',
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-destructive text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="h-full">
      <DiffEditor
        original={originalContent}
        modified={modifiedContent}
        language={getLanguage(filePath)}
        theme="vs-dark"
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          lineNumbers: 'on',
          wordWrap: 'on',
          diffWordWrap: 'on',
          originalEditable: false,
          renderOverviewRuler: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  )
}
