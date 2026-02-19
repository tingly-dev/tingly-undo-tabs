import { ClosedTab, Config, DEFAULT_CONFIG } from '../types'

const STORAGE_KEYS = {
  CLOSED_TABS: 'closedTabs',
  CONFIG: 'config',
} as const

export async function getClosedTabs(): Promise<ClosedTab[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CLOSED_TABS)
  return result[STORAGE_KEYS.CLOSED_TABS] || []
}

export async function saveClosedTabs(tabs: ClosedTab[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CLOSED_TABS]: tabs })
}

export async function addClosedTab(tab: ClosedTab, maxItems: number): Promise<ClosedTab[]> {
  const tabs = await getClosedTabs()
  tabs.unshift(tab)

  // Enforce max limit
  const trimmed = tabs.slice(0, maxItems)
  await saveClosedTabs(trimmed)
  return trimmed
}

export async function removeClosedTab(id: string): Promise<ClosedTab[]> {
  const tabs = await getClosedTabs()
  const filtered = tabs.filter(t => t.id !== id)
  await saveClosedTabs(filtered)
  return filtered
}

export async function clearClosedTabs(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.CLOSED_TABS)
}

export async function getConfig(): Promise<Config> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CONFIG)
  return { ...DEFAULT_CONFIG, ...result[STORAGE_KEYS.CONFIG] }
}

export async function saveConfig(config: Config): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CONFIG]: config })
}
