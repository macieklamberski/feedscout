import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type CsdnUrl, csdnHandler, parseCsdnUrl } from './csdn.js'

describe('parseCsdnUrl', () => {
  it('should return the blog for an article page', () => {
    const expected: CsdnUrl = { kind: 'blog', username: 'someuser' }

    expect(parseCsdnUrl('https://blog.csdn.net/someuser/article/details/1')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseCsdnUrl('https://blog.csdn.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCsdnUrl('https://example.com/someuser')).toBeUndefined()
  })
})

describe('csdnHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://blog.csdn.net/csdnnews'],
      [false, 'https://www.csdn.net/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(csdnHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(csdnHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(csdnHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS feed URL for user blog', () => {
      const value = 'https://blog.csdn.net/csdnnews'
      const expected = [
        {
          uri: 'https://rss.csdn.net/csdnnews/rss/map',
          hint: { key: 'csdn:blog', label: 'Blog' },
        },
      ]

      expect(csdnHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user blog with subpath', () => {
      const value = 'https://blog.csdn.net/csdnnews/article/details/12345'
      const expected = [
        {
          uri: 'https://rss.csdn.net/csdnnews/rss/map',
          hint: { key: 'csdn:blog', label: 'Blog' },
        },
      ]

      expect(csdnHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://blog.csdn.net/'

      expect(csdnHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for a feed on rss.csdn.net', () => {
      const value = 'https://rss.csdn.net/ziping_0918/rss/map'
      const expected: DiscoverUriHint = { key: 'csdn:blog', label: 'Blog' }

      expect(csdnHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a feed on blog.csdn.net', () => {
      const value = 'https://blog.csdn.net/eastmount/rss/map'
      const expected: DiscoverUriHint = { key: 'csdn:blog', label: 'Blog' }

      expect(csdnHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a list feed on blog.csdn.net', () => {
      const value = 'https://blog.csdn.net/csdnnews/rss/list'
      const expected: DiscoverUriHint = { key: 'csdn:blog', label: 'Blog' }

      expect(csdnHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a feed over http', () => {
      const value = 'http://rss.csdn.net/eastmount/rss/map'
      const expected: DiscoverUriHint = { key: 'csdn:blog', label: 'Blog' }

      expect(csdnHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://blog.csdn.net/eastmount/article/details/12345'

      expect(csdnHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a list path on rss.csdn.net', () => {
      const value = 'https://rss.csdn.net/eastmount/rss/list'

      expect(csdnHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on www.csdn.net', () => {
      const value = 'https://www.csdn.net/eastmount/rss/map'

      expect(csdnHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://rss.csdn.net/ziping_0918/rss/map', { key: 'csdn:blog', label: 'Blog' }],
      ['https://rss.csdn.net/eastmount/rss/map', { key: 'csdn:blog', label: 'Blog' }],
      ['https://blog.csdn.net/eastmount/rss/map', { key: 'csdn:blog', label: 'Blog' }],
      ['https://blog.csdn.net/csdnnews/rss/list', { key: 'csdn:blog', label: 'Blog' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [csdnHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
