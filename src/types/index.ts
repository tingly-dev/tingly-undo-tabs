export interface ClosedTab {
  id: string
  url: string
  title: string
  favIconUrl?: string
  closedAt: number
  windowId?: number
}

export interface Config {
  maxItems: number
  showNotifications: boolean
  excludePatterns: string[]
}

export const DEFAULT_CONFIG: Config = {
  maxItems: 100,
  showNotifications: false,
  excludePatterns: [],
}
