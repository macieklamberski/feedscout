import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { TogetterUrl } from './togetter.js'
import { parseTogetterUrl, togetterHandler } from './togetter.js'

describe('parseTogetterUrl', () => {
  it('should return the user for a user page', () => {
    const expected: TogetterUrl = { kind: 'user', username: 'example' }

    expect(parseTogetterUrl('https://togetter.com/id/example')).toEqual(expected)
  })

  it('should return the user for a user page with a capitalized id segment', () => {
    const expected: TogetterUrl = { kind: 'user', username: 'example' }

    expect(parseTogetterUrl('https://togetter.com/Id/example')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: TogetterUrl = { kind: 'user', username: 'example' }

    expect(parseTogetterUrl('https://www.togetter.com/id/example')).toEqual(expected)
  })

  it('should return the recent page for the recent listing', () => {
    const expected: TogetterUrl = { kind: 'recent' }

    expect(parseTogetterUrl('https://togetter.com/recent')).toEqual(expected)
  })

  it('should return the home page for a summary page', () => {
    const expected: TogetterUrl = { kind: 'home' }

    expect(parseTogetterUrl('https://togetter.com/li/123456')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: TogetterUrl = { kind: 'home' }

    expect(parseTogetterUrl('https://togetter.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseTogetterUrl('https://example.com/id/example')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseTogetterUrl('not-a-url')).toBeUndefined()
  })
})

describe('togetterHandler', () => {
  describe('match', () => {
    it('should match a Togetter URL', () => {
      expect(togetterHandler.match('https://togetter.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(togetterHandler.match('https://example.com/id/example')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Togetter', () => {
      expect(togetterHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the curator, news, recent and popular feeds for a curator page', () => {
      const value = 'https://togetter.com/id/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://posfie.com/@example/rss',
          hint: { key: 'togetter:curator', label: 'Curator' },
        },
        { uri: 'https://togetter.com/rss/news', hint: { key: 'togetter:news', label: 'News' } },
        {
          uri: 'https://togetter.com/rss/recent',
          hint: { key: 'togetter:recent', label: 'Recent' },
        },
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })

    it('should return the recent, news and popular feeds for the recent listing', () => {
      const value = 'https://togetter.com/recent'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://togetter.com/rss/recent',
          hint: { key: 'togetter:recent', label: 'Recent' },
        },
        { uri: 'https://togetter.com/rss/news', hint: { key: 'togetter:news', label: 'News' } },
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })

    it('should return the news, recent and popular feeds elsewhere', () => {
      const value = 'https://togetter.com/li/123456'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://togetter.com/rss/news', hint: { key: 'togetter:news', label: 'News' } },
        {
          uri: 'https://togetter.com/rss/recent',
          hint: { key: 'togetter:recent', label: 'Recent' },
        },
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds on the apex host for a page on the www host', () => {
      const value = 'https://www.togetter.com/id/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://posfie.com/@example/rss',
          hint: { key: 'togetter:curator', label: 'Curator' },
        },
        { uri: 'https://togetter.com/rss/news', hint: { key: 'togetter:news', label: 'News' } },
        {
          uri: 'https://togetter.com/rss/recent',
          hint: { key: 'togetter:recent', label: 'Recent' },
        },
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the curator hint for a curator feed on posfie.com', () => {
      const value = 'https://posfie.com/@example/rss'
      const expected: DiscoverUriHint = { key: 'togetter:curator', label: 'Curator' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the recent hint for the recent feed', () => {
      const value = 'https://togetter.com/rss/recent'
      const expected: DiscoverUriHint = { key: 'togetter:recent', label: 'Recent' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a curator page on posfie.com', () => {
      const value = 'https://posfie.com/@example'

      expect(togetterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the curator hint for a curator feed', () => {
      const value = 'https://togetter.com/rss/id/alice_blue'
      const expected: DiscoverUriHint = { key: 'togetter:curator', label: 'Curator' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the curator hint for a curator feed with digits in the name', () => {
      const value = 'https://togetter.com/rss/id/bob54465820'
      const expected: DiscoverUriHint = { key: 'togetter:curator', label: 'Curator' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the curator hint for a curator feed on the www host', () => {
      const value = 'https://www.togetter.com/rss/id/alice_blue'
      const expected: DiscoverUriHint = { key: 'togetter:curator', label: 'Curator' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the curator hint for a curator feed over http', () => {
      const value = 'http://togetter.com/rss/id/alice_blue'
      const expected: DiscoverUriHint = { key: 'togetter:curator', label: 'Curator' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the popular hint for the popular feed', () => {
      const value = 'https://togetter.com/rss/hot'
      const expected: DiscoverUriHint = { key: 'togetter:hot', label: 'Popular' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the popular hint for the popular feed on the www host', () => {
      const value = 'https://www.togetter.com/rss/hot'
      const expected: DiscoverUriHint = { key: 'togetter:hot', label: 'Popular' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news hint for the news feed', () => {
      const value = 'https://togetter.com/rss/news'
      const expected: DiscoverUriHint = { key: 'togetter:news', label: 'News' }

      expect(togetterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a curator page', () => {
      const value = 'https://togetter.com/id/alice_blue'

      expect(togetterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a summary page', () => {
      const value = 'https://togetter.com/li/123456'

      expect(togetterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss/id/alice_blue'

      expect(togetterHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://posfie.com/@example/rss', { key: 'togetter:curator', label: 'Curator' }],
      ['https://togetter.com/rss/id/alice_blue', { key: 'togetter:curator', label: 'Curator' }],
      ['https://togetter.com/rss/recent', { key: 'togetter:recent', label: 'Recent' }],
      ['https://togetter.com/rss/hot', { key: 'togetter:hot', label: 'Popular' }],
      ['https://www.togetter.com/rss/hot', { key: 'togetter:hot', label: 'Popular' }],
      ['https://togetter.com/rss/news', { key: 'togetter:news', label: 'News' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [togetterHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
