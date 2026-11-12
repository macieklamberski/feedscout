import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isSvbtleHtml, svbtleHandler } from './svbtle.js'

const svbtleHtml = '<meta name="generator" content="Svbtle.com" />'
const otherHtml = '<meta name="generator" content="Ghost 5.0">'

describe('isSvbtleHtml', () => {
  it('should return true for the Svbtle generator meta tag', () => {
    expect(isSvbtleHtml(svbtleHtml)).toBe(true)
  })

  it('should return true for the Svbtle asset host', () => {
    const value = '<link rel="stylesheet" href="https://lightning.svbtle.com/cargo/blog.css">'

    expect(isSvbtleHtml(value)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isSvbtleHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isSvbtleHtml('')).toBe(false)
  })
})

describe('svbtleHandler', () => {
  describe('match', () => {
    it('should match a blog on its own host', () => {
      expect(svbtleHandler.match('https://example.com/a-post', svbtleHtml)).toBe(true)
    })

    it('should not match the platform host', () => {
      expect(svbtleHandler.match('https://www.svbtle.com/feed', svbtleHtml)).toBe(false)
      expect(svbtleHandler.match('https://svbtle.com/alice', svbtleHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(svbtleHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed', () => {
      const value = 'https://example.com/a-post'
      const expected = [
        { uri: 'https://example.com/feed', hint: { key: 'svbtle:posts', label: 'Posts' } },
      ]

      expect(svbtleHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the platform host', () => {
      expect(svbtleHandler.resolve('https://www.svbtle.com/alice')).toEqual([])
    })

    it('should keep the http scheme of the blog', () => {
      const value = 'http://alice.svbtle.com/a-post'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'http://alice.svbtle.com/feed', hint: { key: 'svbtle:posts', label: 'Posts' } },
      ]

      expect(svbtleHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for a page outside http', () => {
      const value = 'ftp://alice.svbtle.com/a-post'

      expect(svbtleHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a feed on a blog subdomain', () => {
      const value = 'https://alice.svbtle.com/feed'
      const expected: DiscoverUriHint = { key: 'svbtle:posts', label: 'Posts' }

      expect(svbtleHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed with a trailing slash', () => {
      const value = 'https://alice.svbtle.com/feed/'
      const expected: DiscoverUriHint = { key: 'svbtle:posts', label: 'Posts' }

      expect(svbtleHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://alice.svbtle.com/a-post'

      expect(svbtleHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path on the apex', () => {
      const value = 'https://svbtle.com/feed'

      expect(svbtleHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path on the www host', () => {
      const value = 'https://www.svbtle.com/feed'

      expect(svbtleHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/feed'

      expect(svbtleHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.svbtle.com/feed', { key: 'svbtle:posts', label: 'Posts' }],
      ['http://alice.svbtle.com/feed/', { key: 'svbtle:posts', label: 'Posts' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [svbtleHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
