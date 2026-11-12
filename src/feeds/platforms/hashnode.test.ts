import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type HashnodeUrl, hashnodeHandler, parseHashnodeUrl } from './hashnode.js'

describe('parseHashnodeUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: HashnodeUrl = { kind: 'blog' }

    expect(parseHashnodeUrl('https://jane.hashnode.dev/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseHashnodeUrl('https://example.com/')).toBeUndefined()
  })
})

describe('hashnodeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.hashnode.dev'],
      [false, 'https://blog.example.hashnode.dev'],
      [true, 'https://example.hashnode.com'],
      [false, 'https://hashnode.dev'],
      [false, 'https://www.hashnode.dev'],
      [false, 'https://hashnode.com'],
      [false, 'https://www.hashnode.com'],
      [true, 'https://api.hashnode.dev'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hashnodeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hashnodeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Hashnode', () => {
      expect(hashnodeHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://example.hashnode.dev'
      const expected = [
        {
          uri: 'https://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://example.hashnode.dev/some-article-slug'
      const expected = [
        {
          uri: 'https://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the HTTPS feed URL for an HTTP blog page', () => {
      const value = 'http://example.hashnode.dev/some-article-slug'
      const expected = [
        {
          uri: 'https://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the blog key for a blog feed', () => {
      const value = 'https://example.hashnode.dev/rss.xml'
      const expected = 'hashnode:blog'

      expect(hashnodeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed over HTTP', () => {
      const value = 'http://example.hashnode.dev/rss.xml'
      const expected = 'hashnode:blog'

      expect(hashnodeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed on hashnode.com', () => {
      const value = 'https://example.hashnode.com/rss.xml'
      const expected = 'hashnode:blog'

      expect(hashnodeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://example.hashnode.dev/some-article-slug'

      expect(hashnodeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.hashnode.dev/rss.xml'

      expect(hashnodeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://hashnode.com/blog/rss.xml'

      expect(hashnodeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss.xml'

      expect(hashnodeHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example.hashnode.dev/rss.xml', { key: 'hashnode:blog', label: 'Blog' }],
      ['http://example.hashnode.dev/rss.xml', { key: 'hashnode:blog', label: 'Blog' }],
      ['https://example.hashnode.dev/rss.xml/', { key: 'hashnode:blog', label: 'Blog' }],
      ['https://example.hashnode.com/rss.xml', { key: 'hashnode:blog', label: 'Blog' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [hashnodeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
