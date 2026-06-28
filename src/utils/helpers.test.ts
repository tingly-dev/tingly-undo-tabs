import { describe, expect, it } from 'vitest'

import { searchTabs, shouldExcludeUrl } from './helpers'
import type { ClosedTab } from '../types'

describe('shouldExcludeUrl', () => {
  it('returns true when url matches an excluded prefix', () => {
    expect(shouldExcludeUrl('https://example.com/page', ['https://example.com'])).toBe(true)
  })

  it('returns false when url does not match excluded prefixes', () => {
    expect(shouldExcludeUrl('https://example.com/page', ['https://another.com'])).toBe(false)
  })
})

describe('searchTabs', () => {
  const tabs: ClosedTab[] = [
    {
      id: '1',
      title: 'Claude Docs',
      url: 'https://docs.anthropic.com',
      closedAt: 1,
    },
    {
      id: '2',
      title: 'Example Domain',
      url: 'https://example.com',
      closedAt: 2,
    },
  ]

  it('returns all tabs for an empty query', () => {
    expect(searchTabs(tabs, '')).toEqual(tabs)
  })

  it('matches tabs by title case-insensitively', () => {
    expect(searchTabs(tabs, 'claude')).toEqual([tabs[0]])
  })

  it('matches tabs by url case-insensitively', () => {
    expect(searchTabs(tabs, 'EXAMPLE.COM')).toEqual([tabs[1]])
  })
})
