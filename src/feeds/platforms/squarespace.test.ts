import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  isSquarespaceHeaders,
  parseSquarespaceUrl,
  type SquarespaceUrl,
  squarespaceHandler,
} from './squarespace.js'

const squarespaceHeaders = new Headers({ server: 'Squarespace' })

describe('isSquarespaceHeaders', () => {
  it('should return true for the Squarespace server header', () => {
    expect(isSquarespaceHeaders(squarespaceHeaders)).toBe(true)
  })

  it('should return true case-insensitively', () => {
    expect(isSquarespaceHeaders(new Headers({ server: 'squarespace' }))).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isSquarespaceHeaders(new Headers())).toBe(false)
    expect(isSquarespaceHeaders(new Headers({ server: 'nginx' }))).toBe(false)
  })
})

describe('parseSquarespaceUrl', () => {
  it('should return the collection for a collection page', () => {
    const expected: SquarespaceUrl = { kind: 'collection', collection: 'blog' }

    expect(parseSquarespaceUrl('https://site.example/blog')).toEqual(expected)
  })

  it('should return the collection for a post page', () => {
    const expected: SquarespaceUrl = { kind: 'collection', collection: 'blog' }

    expect(parseSquarespaceUrl('https://site.example/blog/first-post')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseSquarespaceUrl('https://site.example/')).toBeUndefined()
  })
})

describe('squarespaceHandler', () => {
  describe('match', () => {
    it('should match a collection path', () => {
      const value = 'https://example.com/blog'

      expect(squarespaceHandler.match(value, '', squarespaceHeaders)).toBe(true)
    })

    it('should match a collection path under any slug', () => {
      const value = 'https://example.com/journal/a-post'

      expect(squarespaceHandler.match(value, '', squarespaceHeaders)).toBe(true)
    })

    it('should not match the site root', () => {
      expect(squarespaceHandler.match('https://example.com/', '', squarespaceHeaders)).toBe(false)
    })

    it('should not match without the header', () => {
      expect(squarespaceHandler.match('https://example.com/blog')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(squarespaceHandler.match('not-a-url', '', squarespaceHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for the root', () => {
      expect(squarespaceHandler.resolve('https://site.example/')).toEqual([])
    })

    it('should return the collection feed', () => {
      const value = 'https://example.com/blog'
      const expected = [
        {
          uri: 'https://example.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should use the first path segment of a deeper page', () => {
      const value = 'https://example.com/news/a-post'
      const expected = [
        {
          uri: 'https://example.com/news?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(squarespaceHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the collection feed of a site on squarespace.com', () => {
      const value = 'https://alice.squarespace.com/blog/a-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a site on squarespace.com', () => {
      const value = 'http://alice.squarespace.com/blog'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the collection hint for a collection feed on squarespace.com', () => {
      const value = 'https://alice.squarespace.com/blog?format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collection hint for an http collection feed', () => {
      const value = 'http://alice.squarespace.com/podcast?format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collection hint for a feed with a trailing slash', () => {
      const value = 'https://alice.squarespace.com/blog/?format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collection hint for a category feed', () => {
      const value = 'https://alice.squarespace.com/blog?category=News&format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a collection page', () => {
      const value = 'https://alice.squarespace.com/blog'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.squarespace.com/blog?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://squarespace.com/blog?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.alice.squarespace.com/news?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/blog?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<string> = [
      'https://alice.squarespace.com/blog?format=rss',
      'http://alice.squarespace.com/podcast?format=rss',
      'https://alice.squarespace.com/blog/?category=News&format=rss',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [squarespaceHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'squarespace:collection', label: 'Collection' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
