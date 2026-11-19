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

    it('should keep the scheme of an HTTP blog page', () => {
      const value = 'http://example.hashnode.dev/some-article-slug'
      const expected = [
        {
          uri: 'http://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog key for a blog feed on hashnode.com', () => {
      const value = 'https://example.hashnode.com/rss.xml'
      const expected: DiscoverUriHint = { key: 'hashnode:blog', label: 'Blog' }

      expect(hashnodeHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a blog feed on hashnode.com as itself', async () => {
      const value = 'https://example.hashnode.com/rss.xml'
      const hint: DiscoverUriHint = { key: 'hashnode:blog', label: 'Blog' }
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
