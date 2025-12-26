import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import type { StoredData, Session } from '../../shared/types'

const DEFAULT_DATA: StoredData = {
  sessions: [],
  reviewedFiles: {}
}

export class StorageService {
  private dataPath: string
  private data: StoredData

  constructor() {
    const userDataPath = app.getPath('userData')
    this.dataPath = join(userDataPath, 'sessions.json')
    this.data = this.load()
  }

  private load(): StoredData {
    try {
      if (existsSync(this.dataPath)) {
        const content = readFileSync(this.dataPath, 'utf-8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.error('Failed to load storage:', error)
    }
    return { ...DEFAULT_DATA }
  }

  private save(): void {
    try {
      const dir = join(this.dataPath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2))
    } catch (error) {
      console.error('Failed to save storage:', error)
    }
  }

  getSessions(): Session[] {
    return this.data.sessions
  }

  addSession(session: Session): void {
    this.data.sessions.push(session)
    this.save()
  }

  removeSession(sessionId: string): void {
    this.data.sessions = this.data.sessions.filter(s => s.id !== sessionId)
    delete this.data.reviewedFiles[sessionId]
    this.save()
  }

  updateSession(sessionId: string, updates: Partial<Session>): void {
    const index = this.data.sessions.findIndex(s => s.id === sessionId)
    if (index >= 0) {
      this.data.sessions[index] = { ...this.data.sessions[index], ...updates }
      this.save()
    }
  }

  getReviewedFiles(sessionId: string): string[] {
    return this.data.reviewedFiles[sessionId] || []
  }

  setReviewedFiles(sessionId: string, files: string[]): void {
    this.data.reviewedFiles[sessionId] = files
    this.save()
  }

  addReviewedFile(sessionId: string, filePath: string): void {
    if (!this.data.reviewedFiles[sessionId]) {
      this.data.reviewedFiles[sessionId] = []
    }
    if (!this.data.reviewedFiles[sessionId].includes(filePath)) {
      this.data.reviewedFiles[sessionId].push(filePath)
      this.save()
    }
  }

  removeReviewedFile(sessionId: string, filePath: string): void {
    if (this.data.reviewedFiles[sessionId]) {
      this.data.reviewedFiles[sessionId] = this.data.reviewedFiles[sessionId].filter(
        f => f !== filePath
      )
      this.save()
    }
  }

  clearReviewedFiles(sessionId: string): void {
    delete this.data.reviewedFiles[sessionId]
    this.save()
  }
}

export const storageService = new StorageService()
