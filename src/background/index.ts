import { addClosedTab, getConfig } from '../utils/storage'
import { shouldExcludeUrl, generateTabId } from '../utils/helpers'
import { ClosedTab } from '../types'

// Track tabs before they're removed (to capture info)
const tabInfoMap = new Map<number, { url: string; title: string; favIconUrl?: string }>()

// Capture tab info when it might be closed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    tabInfoMap.set(tabId, {
      url: tab.url,
      title: tab.title || tab.url,
      favIconUrl: tab.favIconUrl,
    })
  }
})

// Record closed tab
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Skip incognito windows
  if (removeInfo.isWindowClosing) return

  const tabInfo = tabInfoMap.get(tabId)
  tabInfoMap.delete(tabId)

  if (!tabInfo) return

  const config = await getConfig()

  // Check if URL should be excluded
  if (shouldExcludeUrl(tabInfo.url, config.excludePatterns)) {
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
})

// Clean up tabInfoMap periodically
setInterval(() => {
  // Keep only recent entries - limit the map size
  if (tabInfoMap.size > 100) {
    const entries = Array.from(tabInfoMap.entries())
    tabInfoMap.clear()
    entries.slice(-50).forEach(([k, v]) => tabInfoMap.set(k, v))
  }
}, 60000)

export {}
