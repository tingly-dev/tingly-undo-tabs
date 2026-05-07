import { addClosedTab, getConfig } from '../utils/storage'
import { shouldExcludeUrl, generateTabId } from '../utils/helpers'
import { ClosedTab } from '../types'

type TabInfo = { url: string; title: string; favIconUrl?: string }

const TAB_INFO_KEY = 'tabInfoMap'

// --- Session-scoped persistence helpers ---

async function loadTabInfoMap(): Promise<Map<number, TabInfo>> {
  try {
    const result = await chrome.storage.session.get(TAB_INFO_KEY)
    const raw: Record<string, TabInfo> | undefined = result[TAB_INFO_KEY]
    if (raw) {
      const map = new Map<number, TabInfo>()
      for (const [k, v] of Object.entries(raw)) {
        map.set(Number(k), v)
      }
      return map
    }
  } catch {
    // storage.session unavailable — fall back to empty map
  }
  return new Map()
}

async function saveTabInfoMap(map: Map<number, TabInfo>): Promise<void> {
  try {
    const obj: Record<string, TabInfo> = {}
    for (const [k, v] of map.entries()) {
      obj[String(k)] = v
    }
    await chrome.storage.session.set({ [TAB_INFO_KEY]: obj })
  } catch (error) {
    console.error('[Tab History] Failed to save tab info map:', error)
  }
}

// --- Core logic ---

let tabInfoMap: Map<number, TabInfo>

// Initialize: load from session storage first, then sync with actual tabs
async function initializeExistingTabs() {
  tabInfoMap = await loadTabInfoMap()

  // Sync with current open tabs — remove stale entries, add missing ones
  const tabs = await chrome.tabs.query({})
  const currentIds = new Set<number>()

  for (const tab of tabs) {
    if (tab.id === undefined) continue
    currentIds.add(tab.id)
    tabInfoMap.set(tab.id, {
      url: tab.url || '',
      title: tab.title || tab.url || 'New Tab',
      favIconUrl: tab.favIconUrl,
    })
  }

  // Remove entries for tabs that no longer exist
  for (const id of tabInfoMap.keys()) {
    if (!currentIds.has(id)) {
      tabInfoMap.delete(id)
    }
  }

  await saveTabInfoMap(tabInfoMap)
}

async function updateTabInfo(tabId: number, tabInfo: TabInfo): Promise<void> {
  tabInfoMap.set(tabId, tabInfo)
  await saveTabInfoMap(tabInfoMap)
}

async function removeTabInfo(tabId: number): Promise<void> {
  tabInfoMap.delete(tabId)
  await saveTabInfoMap(tabInfoMap)
}

// --- Register listeners after initialization ---

async function main() {
  await initializeExistingTabs()

  // Capture tab info on created (record all tabs, even without URL yet)
  chrome.tabs.onCreated.addListener((tab) => {
    if (tab.id !== undefined) {
      updateTabInfo(tab.id, {
        url: tab.url || '',
        title: tab.title || tab.url || 'New Tab',
        favIconUrl: tab.favIconUrl,
      })
    }
  })

  // Capture tab info on updated (for pages that load after creation)
  chrome.tabs.onUpdated.addListener((tabId, _changeInfo, tab) => {
    if (tab.url) {
      updateTabInfo(tabId, {
        url: tab.url,
        title: tab.title || tab.url,
        favIconUrl: tab.favIconUrl,
      })
    }
  })

  // Record closed tab
  chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    // Skip when window is closing
    if (removeInfo.isWindowClosing) return

    let tabInfo = tabInfoMap.get(tabId)

    // Fallback: if tab info is missing, try to get it from window history
    // Note: once tab is removed, we can't query it directly, but we may have
    // cached info from other sources
    if (!tabInfo) {
      console.warn('[Tab History] Tab info missing for closed tab:', tabId)
      // Try to get any remaining info from browser session if available
      await removeTabInfo(tabId)
      return
    }

    await removeTabInfo(tabId)

    const config = await getConfig()

    // Check if URL should be excluded (also exclude empty URLs)
    if (!tabInfo.url || shouldExcludeUrl(tabInfo.url, config.excludePatterns)) {
      return
    }

    const closedTab: ClosedTab = {
      id: generateTabId(),
      url: tabInfo.url,
      title: tabInfo.title,
      favIconUrl: tabInfo.favIconUrl,
      closedAt: Date.now(),
      windowId: removeInfo.windowId,
    }

    await addClosedTab(closedTab, config.maxItems)
    console.log('[Tab History] Recorded closed tab:', tabInfo.title, tabInfo.url)
  })

  // Clean up tabInfoMap periodically
  setInterval(async () => {
    if (tabInfoMap.size > 500) {
      // Sync with actual tabs instead of blindly dropping entries
      const tabs = await chrome.tabs.query({})
      const currentIds = new Set(tabs.map(t => t.id))
      const cleaned = new Map<number, TabInfo>()
      for (const [id, info] of tabInfoMap.entries()) {
        if (currentIds.has(id)) {
          cleaned.set(id, info)
        }
      }
      tabInfoMap = cleaned
      await saveTabInfoMap(tabInfoMap)
    }
  }, 60000)
}

main().catch(console.error)

export {}
