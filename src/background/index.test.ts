import { beforeEach, describe, expect, it, vi } from 'vitest'

const addClosedTabMock = vi.fn()
const getConfigMock = vi.fn()
const generateTabIdMock = vi.fn(() => 'generated-id')

vi.mock('../utils/storage', () => ({
  addClosedTab: addClosedTabMock,
  getConfig: getConfigMock,
}))

vi.mock('../utils/helpers', async () => {
  const actual = await vi.importActual<typeof import('../utils/helpers')>('../utils/helpers')
  return {
    ...actual,
    generateTabId: generateTabIdMock,
  }
})

type ChromeTab = {
  id?: number
  url?: string
  title?: string
  favIconUrl?: string
  windowId?: number
}

type RemovedListener = (tabId: number, removeInfo: { isWindowClosing: boolean; windowId: number }) => Promise<void>
type CreatedListener = (tab: ChromeTab) => void

let onCreatedListener: CreatedListener | undefined
let onRemovedListener: RemovedListener | undefined
let queryMock: ReturnType<typeof vi.fn>
let sessionGetMock: ReturnType<typeof vi.fn>
let sessionStorageGetMock: ReturnType<typeof vi.fn>
let sessionStorageSetMock: ReturnType<typeof vi.fn>
let setIntervalMock: ReturnType<typeof vi.fn>
let warnMock: ReturnType<typeof vi.spyOn>
let logMock: ReturnType<typeof vi.spyOn>

async function loadBackgroundModule() {
  await import('./index')
  await Promise.resolve()
}

describe('background close tab capture', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    onCreatedListener = undefined
    onRemovedListener = undefined

    queryMock = vi.fn().mockResolvedValue([])
    sessionGetMock = vi.fn().mockResolvedValue([])
    sessionStorageGetMock = vi.fn().mockResolvedValue({})
    sessionStorageSetMock = vi.fn().mockResolvedValue(undefined)
    setIntervalMock = vi.fn()

    getConfigMock.mockResolvedValue({
      maxItems: 100,
      showNotifications: false,
      excludePatterns: [],
    })
    addClosedTabMock.mockResolvedValue([])
    generateTabIdMock.mockReturnValue('generated-id')

    vi.stubGlobal('chrome', {
      storage: {
        session: {
          get: sessionStorageGetMock,
          set: sessionStorageSetMock,
        },
      },
      sessions: {
        getRecentlyClosed: sessionGetMock,
      },
      tabs: {
        query: queryMock,
        onCreated: {
          addListener: vi.fn((listener: CreatedListener) => {
            onCreatedListener = listener
          }),
        },
        onUpdated: {
          addListener: vi.fn(() => {}),
        },
        onRemoved: {
          addListener: vi.fn((listener: RemovedListener) => {
            onRemovedListener = listener
          }),
        },
      },
    })

    setIntervalMock = vi.fn()
    vi.stubGlobal('setInterval', setIntervalMock)

    warnMock = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logMock = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('records a closed tab from recently closed sessions when cache misses', async () => {
    sessionGetMock.mockResolvedValue([
      {
        tab: {
          windowId: 9,
          url: 'https://example.com/background',
          title: 'Background tab',
          favIconUrl: 'https://example.com/icon.png',
        },
      },
    ])

    await loadBackgroundModule()

    expect(onRemovedListener).toBeTypeOf('function')
    await onRemovedListener!(101, { isWindowClosing: false, windowId: 9 })

    expect(addClosedTabMock).toHaveBeenCalledWith(
      {
        id: 'generated-id',
        url: 'https://example.com/background',
        title: 'Background tab',
        favIconUrl: 'https://example.com/icon.png',
        closedAt: expect.any(Number),
        windowId: 9,
      },
      100,
    )
    expect(logMock).toHaveBeenCalledWith(
      '[Tab History] Recorded closed tab:',
      'Background tab',
      'https://example.com/background',
    )
  })

  it('prefers cached tab info over recently closed sessions', async () => {
    sessionGetMock.mockResolvedValue([
      {
        tab: {
          windowId: 3,
          url: 'https://fallback.example.com',
          title: 'Fallback tab',
        },
      },
    ])

    await loadBackgroundModule()

    expect(onCreatedListener).toBeTypeOf('function')
    onCreatedListener!({
      id: 12,
      windowId: 3,
      url: 'https://cached.example.com',
      title: 'Cached tab',
      favIconUrl: 'https://cached.example.com/icon.png',
    })
    await Promise.resolve()

    await onRemovedListener!(12, { isWindowClosing: false, windowId: 3 })

    expect(addClosedTabMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://cached.example.com',
        title: 'Cached tab',
        favIconUrl: 'https://cached.example.com/icon.png',
      }),
      100,
    )
    expect(sessionGetMock).not.toHaveBeenCalled()
  })

  it('does not record a tab when all recently closed entries are from another window', async () => {
    sessionGetMock.mockResolvedValue([
      {
        tab: {
          windowId: 99,
          url: 'https://wrong-window.example.com',
          title: 'Wrong window',
        },
      },
    ])

    await loadBackgroundModule()
    await onRemovedListener!(45, { isWindowClosing: false, windowId: 8 })

    expect(addClosedTabMock).not.toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalledWith('[Tab History] Tab info missing for closed tab:', 45)
  })

  it('skips recording when window is closing', async () => {
    await loadBackgroundModule()
    await onRemovedListener!(77, { isWindowClosing: true, windowId: 5 })

    expect(sessionGetMock).not.toHaveBeenCalled()
    expect(addClosedTabMock).not.toHaveBeenCalled()
  })

  it('skips recording excluded urls recovered from sessions', async () => {
    getConfigMock.mockResolvedValue({
      maxItems: 100,
      showNotifications: false,
      excludePatterns: ['https://blocked.example.com'],
    })
    sessionGetMock.mockResolvedValue([
      {
        tab: {
          windowId: 11,
          url: 'https://blocked.example.com/path',
          title: 'Blocked tab',
        },
      },
    ])

    await loadBackgroundModule()
    await onRemovedListener!(66, { isWindowClosing: false, windowId: 11 })

    expect(addClosedTabMock).not.toHaveBeenCalled()
  })
})
