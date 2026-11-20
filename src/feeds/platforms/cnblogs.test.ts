import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type CnblogsUrl, cnblogsHandler, parseCnblogsUrl } from './cnblogs.js'

describe('parseCnblogsUrl', () => {
  it('should return the blog for a post page', () => {
    const expected: CnblogsUrl = { kind: 'blog', username: 'someuser' }

    expect(parseCnblogsUrl('https://www.cnblogs.com/someuser/p/123.html')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseCnblogsUrl('https://www.cnblogs.com/')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseCnblogsUrl('https://www.cnblogs.com/skins.aspx')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCnblogsUrl('https://example.com/someuser')).toBeUndefined()
  })
})

describe('cnblogsHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(cnblogsHandler.match('https://www.cnblogs.com/example/')).toBe(true)
      expect(cnblogsHandler.match('https://cnblogs.com/example')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(cnblogsHandler.match('https://www.cnblogs.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(cnblogsHandler.match('https://example.com/user')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(cnblogsHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(cnblogsHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed', () => {
      const value = 'https://www.cnblogs.com/example/'
      const expected = [
        {
          uri: 'https://www.cnblogs.com/example/rss',
          hint: { key: 'cnblogs:posts', label: 'Posts' },
        },
      ]

      expect(cnblogsHandler.resolve(value)).toEqual(expected)
    })

    it('should use the username from a post page', () => {
      const value = 'https://www.cnblogs.com/example/p/123456.html'
      const expected = [
        {
          uri: 'https://www.cnblogs.com/example/rss',
          hint: { key: 'cnblogs:posts', label: 'Posts' },
        },
      ]

      expect(cnblogsHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https www feed for an http apex page', () => {
      const value = 'http://cnblogs.com/example'
      const expected = [
        {
          uri: 'https://www.cnblogs.com/example/rss',
          hint: { key: 'cnblogs:posts', label: 'Posts' },
        },
      ]

      expect(cnblogsHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(cnblogsHandler.resolve('https://www.cnblogs.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a posts feed on the feed host without a trailing slash', () => {
      const value = 'https://feed.cnblogs.com/blog/u/12345/rss'
      const expected: DiscoverUriHint = { key: 'cnblogs:posts', label: 'Posts' }

      expect(cnblogsHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a posts feed on the feed host as itself', async () => {
      const value = 'https://feed.cnblogs.com/blog/u/12345/rss'
      const hint: DiscoverUriHint = { key: 'cnblogs:posts', label: 'Posts' }
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [cnblogsHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
