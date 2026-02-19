import { DEFAULT_CONFIG } from '../types'

export function shouldExcludeUrl(url: string, patterns: string[] = DEFAULT_CONFIG.excludePatterns): boolean {
  if (!url) return true
  return patterns.some(pattern => url.startsWith(pattern))
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

import { ClosedTab } from '../types'

export function searchTabs(tabs: ClosedTab[], query: string): ClosedTab[] {
  if (!query.trim()) return tabs

  const lowerQuery = query.toLowerCase()
  return tabs.filter(tab =>
    tab.title.toLowerCase().includes(lowerQuery) ||
    tab.url.toLowerCase().includes(lowerQuery)
  )
}
