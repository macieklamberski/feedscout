import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseTistoryUrl, type TistoryUrl, tistoryHandler } from './tistory.js'

describe('parseTistoryUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: TistoryUrl = { kind: 'blog' }

    expect(parseTistoryUrl('https://example.tistory.com/')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseTistoryUrl('https://tistory.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTistoryUrl('https://example.com/')).toBeUndefined()
  })
})

describe('tistoryHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.tistory.com'],
      [false, 'https://blog.example.tistory.com'],
      [false, 'https://tistory.com'],
      [false, 'https://www.tistory.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(tistoryHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(tistoryHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Tistory', () => {
      expect(tistoryHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.tistory.com'
      const expected = [
        {
          uri: 'https://alice.tistory.com/rss',
          hint: { key: 'tistory:blog', label: 'Blog' },
        },
      ]

      expect(tistoryHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.tistory.com/123'
      const expected = [
        {
          uri: 'https://alice.tistory.com/rss',
          hint: { key: 'tistory:blog', label: 'Blog' },
        },
      ]

      expect(tistoryHandler.resolve(value)).toEqual(expected)
    })

    it('should return an http feed for an http page', () => {
      const value = 'http://alice.tistory.com/123'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.tistory.com/rss',
          hint: { key: 'tistory:blog', label: 'Blog' },
        },
      ]

      expect(tistoryHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for an RSS feed', () => {
      const value = 'https://alice.tistory.com/rss'
      const expected: DiscoverUriHint = { key: 'tistory:blog', label: 'Blog' }

      expect(tistoryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for an http RSS feed', () => {
      const value = 'http://alice.tistory.com/rss'
      const expected: DiscoverUriHint = { key: 'tistory:blog', label: 'Blog' }

      expect(tistoryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for the feed path', () => {
      const value = 'https://alice.tistory.com/feed'
      const expected: DiscoverUriHint = { key: 'tistory:blog', label: 'Blog' }

      expect(tistoryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for the index.xml path', () => {
      const value = 'https://alice.tistory.com/index.xml'
      const expected: DiscoverUriHint = { key: 'tistory:blog', label: 'Blog' }

      expect(tistoryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a post page', () => {
      const value = 'https://alice.tistory.com/123'

      expect(tistoryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex', () => {
      const value = 'https://tistory.com/rss'

      expect(tistoryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the www host', () => {
      const value = 'https://www.tistory.com/rss'

      expect(tistoryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.alice.tistory.com/rss'

      expect(tistoryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss'

      expect(tistoryHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'tistory:blog', label: 'Blog' }
    const ownFeeds: Array<string> = [
      'https://alice.tistory.com/rss',
      'https://alice.tistory.com/rss/',
      'http://alice.tistory.com/rss',
      'https://alice.tistory.com/feed',
      'https://alice.tistory.com/index.xml',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [tistoryHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
