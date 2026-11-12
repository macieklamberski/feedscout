import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type CanalblogUrl, canalblogHandler, parseCanalblogUrl } from './canalblog.js'

describe('parseCanalblogUrl', () => {
  it('should return the blog for a blog home page', () => {
    const value = 'https://alice.canalblog.com/'
    const expected: CanalblogUrl = {
      kind: 'blog',
      blog: 'alice',
    }

    expect(parseCanalblogUrl(value)).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const value = 'https://alice.canalblog.com/archives/2024/05/19/12345678.html'
    const expected: CanalblogUrl = {
      kind: 'blog',
      blog: 'alice',
    }

    expect(parseCanalblogUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseCanalblogUrl('https://www.canalblog.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseCanalblogUrl('https://www.alice.canalblog.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseCanalblogUrl('https://canalblog.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCanalblogUrl('https://example.com/')).toBeUndefined()
  })
})

describe('canalblogHandler', () => {
  describe('match', () => {
    it('should match a blog URL', () => {
      expect(canalblogHandler.match('https://alice.canalblog.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(canalblogHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed for blog', () => {
      const value = 'https://alice.canalblog.com/archives/2024/05/19/12345678.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.canalblog.com/rss',
          hint: { key: 'canalblog:posts', label: 'Posts' },
        },
      ]

      expect(canalblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the HTTPS posts feed for an HTTP blog page', () => {
      const value = 'http://alice.canalblog.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.canalblog.com/rss',
          hint: { key: 'canalblog:posts', label: 'Posts' },
        },
      ]

      expect(canalblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Canalblog', () => {
      expect(canalblogHandler.resolve('https://example.com/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for the posts feed', () => {
      const value = 'https://alice.canalblog.com/rss'
      const expected = 'canalblog:posts'

      expect(canalblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the HTTP posts feed', () => {
      const value = 'http://alice.canalblog.com/rss'
      const expected = 'canalblog:posts'

      expect(canalblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for the posts feed with a trailing slash', () => {
      const value = 'https://alice.canalblog.com/rss/'
      const expected = 'canalblog:posts'

      expect(canalblogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://alice.canalblog.com/archives/2024/05/19/12345678.html'

      expect(canalblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path on the www host', () => {
      const value = 'https://www.canalblog.com/rss'

      expect(canalblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path on a nested subdomain', () => {
      const value = 'https://a.alice.canalblog.com/rss'

      expect(canalblogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path on another host', () => {
      const value = 'https://example.com/rss'

      expect(canalblogHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const postsHint: DiscoverUriHint = { key: 'canalblog:posts', label: 'Posts' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.canalblog.com/rss', postsHint],
      ['http://alice.canalblog.com/rss', postsHint],
      ['https://alice.canalblog.com/rss/', postsHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [canalblogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
