import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseWeblogLolUrl, type WeblogLolUrl, weblogLolHandler } from './weblogLol.js'

describe('parseWeblogLolUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: WeblogLolUrl = { kind: 'blog' }

    expect(parseWeblogLolUrl('https://example.weblog.lol/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseWeblogLolUrl('https://example.com/')).toBeUndefined()
  })
})

describe('weblogLolHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.weblog.lol'],
      [false, 'https://blog.example.weblog.lol'],
      [false, 'https://weblog.lol'],
      [false, 'https://www.weblog.lol'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(weblogLolHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(weblogLolHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside weblog.lol', () => {
      expect(weblogLolHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS, Atom, and JSON feeds for blog', () => {
      const value = 'https://alice.weblog.lol'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.weblog.lol/rss.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.weblog.lol/atom.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.weblog.lol/feed.json',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(weblogLolHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://alice.weblog.lol/some-article-slug'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.weblog.lol/rss.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.weblog.lol/atom.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.weblog.lol/feed.json',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(weblogLolHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http blog page', () => {
      const value = 'http://alice.weblog.lol/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.weblog.lol/rss.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.weblog.lol/atom.xml',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.weblog.lol/feed.json',
          hint: { key: 'weblog-lol:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(weblogLolHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS feed', () => {
      const value = 'https://alice.weblog.lol/rss.xml'
      const expected = 'weblog-lol:posts'

      expect(weblogLolHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an Atom feed', () => {
      const value = 'https://alice.weblog.lol/atom.xml'
      const expected = 'weblog-lol:posts'

      expect(weblogLolHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a JSON feed', () => {
      const value = 'https://alice.weblog.lol/feed.json'
      const expected = 'weblog-lol:posts'

      expect(weblogLolHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a feed with a trailing slash', () => {
      const value = 'https://alice.weblog.lol/rss.xml/'
      const expected = 'weblog-lol:posts'

      expect(weblogLolHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://alice.weblog.lol/some-article-slug'

      expect(weblogLolHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a tag page', () => {
      const value = 'https://alice.weblog.lol/tag/example/rss.xml'

      expect(weblogLolHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.weblog.lol/rss.xml'

      expect(weblogLolHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'https://www.weblog.lol/rss.xml'

      expect(weblogLolHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://weblog.lol/rss.xml'

      expect(weblogLolHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss.xml'

      expect(weblogLolHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'weblog-lol:posts', label: 'Posts' }
    const values: Array<string> = [
      'https://alice.weblog.lol/rss.xml',
      'https://alice.weblog.lol/atom.xml',
      'https://alice.weblog.lol/feed.json',
      'https://alice.weblog.lol/rss.xml/',
    ]

    it.each(values)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [weblogLolHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
