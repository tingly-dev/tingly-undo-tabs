import { addClosedTab, getConfig } from '../utils/storage'
import { shouldExcludeUrl, generateTabId } from '../utils/helpers'
import { ClosedTab } from '../types'

// Track tabs info (keyed by tabId)
const tabInfoMap = new Map<number, { url: string; title: string; favIconUrl?: string }>()

// Initialize existing tabs on service worker start
async function initializeExistingTabs() {
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id !== undefined && tab.url) {
      tabInfoMap.set(tab.id, {
        url: tab.url,
        title: tab.title || tab.url,
        favIconUrl: tab.favIconUrl,
      })
    }
  }
}

// Run initialization
initializeExistingTabs()

// Capture tab info on created
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined && tab.url) {
    tabInfoMap.set(tab.id, {
      url: tab.url,
      title: tab.title || tab.url,
      favIconUrl: tab.favIconUrl,
    })
  }
})

// Capture tab info on updated (for pages that load after creation)
chrome.tabs.onUpdated.addListener((tabId, _changeInfo, tab) => {
  if (tab.url) {
    tabInfoMap.set(tabId, {
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
  if (tabInfoMap.size > 100) {
    const entries = Array.from(tabInfoMap.entries())
    tabInfoMap.clear()
    entries.slice(-50).forEach(([k, v]) => tabInfoMap.set(k, v))
  }
}, 60000)

export {}
