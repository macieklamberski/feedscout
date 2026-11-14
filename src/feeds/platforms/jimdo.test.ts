import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isJimdoHeaders, jimdoHandler } from './jimdo.js'

const jimdoHeaders = new Headers({ 'x-jimdo-wid': 's1c8254714bfd7968' })
const otherHeaders = new Headers({ 'x-wix-request-id': '1790000000.123' })

describe('isJimdoHeaders', () => {
  it('should return true for the site id header', () => {
    expect(isJimdoHeaders(jimdoHeaders)).toBe(true)
  })

  it('should return false for another platform', () => {
    expect(isJimdoHeaders(otherHeaders)).toBe(false)
  })
})

describe('jimdoHandler', () => {
  describe('match', () => {
    it('should match a page by the site id header', () => {
      const value = 'https://www.quon-for.com/'

      expect(jimdoHandler.match(value, '<html></html>', jimdoHeaders)).toBe(true)
    })

    it('should not match the generator meta tag alone', () => {
      const value = 'https://www.quon-for.com/'
      const content = '<meta name="generator" content="Jimdo Creator">'

      expect(jimdoHandler.match(value, content, otherHeaders)).toBe(false)
    })

    it('should not match without headers', () => {
      expect(jimdoHandler.match('https://www.quon-for.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog feed at the site root', () => {
      const value = 'https://www.studium-universale.de/blog/'
      const expected = [
        {
          uri: 'https://www.studium-universale.de/rss/blog',
          hint: { key: 'jimdo:blog', label: 'Blog' },
        },
      ]

      expect(jimdoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed on a Jimdo subdomain', () => {
      const value = 'https://neubritz.jimdofree.com/'
      const expected = [
        {
          uri: 'https://neubritz.jimdofree.com/rss/blog',
          hint: { key: 'jimdo:blog', label: 'Blog' },
        },
      ]

      expect(jimdoHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedUrls: Array<[string, DiscoverUriHint]> = [
      ['https://example.jimdofree.com/rss/blog', { key: 'jimdo:blog', label: 'Blog' }],
      ['http://example.jimdofree.com/rss/blog/', { key: 'jimdo:blog', label: 'Blog' }],
      ['https://example.jimdofree.com/rss/blog/news', { key: 'jimdo:blog-tag', label: 'Tag' }],
    ]

    it.each(feedUrls)('should return the hint for %s', (value, expected) => {
      expect(jimdoHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page on a site subdomain', () => {
      const value = 'https://example.jimdofree.com/blog/'

      expect(jimdoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://www.example.com/rss/blog'

      expect(jimdoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://jimdofree.com/rss/blog'

      expect(jimdoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'https://www.jimdofree.com/rss/blog'

      expect(jimdoHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.jimdofree.com/rss/blog'

      expect(jimdoHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example.jimdofree.com/rss/blog', { key: 'jimdo:blog', label: 'Blog' }],
      ['http://example.jimdofree.com/rss/blog', { key: 'jimdo:blog', label: 'Blog' }],
      ['https://example.jimdofree.com/rss/blog/news', { key: 'jimdo:blog-tag', label: 'Tag' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [jimdoHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
