import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isWixHtml, parseWixUrl, type WixUrl, wixHandler } from './wix.js'

const wixHtml = '<meta name="generator" content="Wix.com Website Builder"/>'
const otherHtml = '<meta name="generator" content="Squarespace">'

describe('isWixHtml', () => {
  it('should return true for the Wix generator meta tag', () => {
    expect(isWixHtml(wixHtml)).toBe(true)
  })

  it('should return true for the Wix asset host', () => {
    const value = '<script src="https://static.parastorage.com/services/app.js"></script>'

    expect(isWixHtml(value)).toBe(true)
  })

  it('should return false for a link to the Wix asset host', () => {
    const value = '<a href="https://static.parastorage.com/services/app.js">app</a>'

    expect(isWixHtml(value)).toBe(false)
  })

  it('should return false for another generator', () => {
    expect(isWixHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isWixHtml('')).toBe(false)
  })
})

describe('parseWixUrl', () => {
  it('should return the free site for a wixsite.com path', () => {
    const value = 'https://alice.wixsite.com/mysite/blog'
    const expected: WixUrl = { kind: 'freeSite', account: 'alice', site: 'mysite' }

    expect(parseWixUrl(value)).toEqual(expected)
  })

  it('should return the site for a custom domain', () => {
    const expected: WixUrl = { kind: 'site' }

    expect(parseWixUrl('https://www.example.com/blog')).toEqual(expected)
  })

  it('should return the site for a wixsite.com root', () => {
    const expected: WixUrl = { kind: 'site' }

    expect(parseWixUrl('https://alice.wixsite.com/')).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseWixUrl('not-a-url')).toBeUndefined()
  })
})

describe('wixHandler', () => {
  describe('match', () => {
    it('should match a Wix page', () => {
      expect(wixHandler.match('https://example.com/post/a-post', wixHtml)).toBe(true)
    })

    it('should match a page by the request id header', () => {
      const value = 'https://example.com/'
      const headers = new Headers({ 'x-wix-request-id': '1790000000.123' })

      expect(wixHandler.match(value, '<html></html>', headers)).toBe(true)
    })

    it('should not match without content', () => {
      expect(wixHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match another platform', () => {
      expect(wixHandler.match('https://example.com/', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(wixHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the blog feed at the site root', () => {
      const value = 'https://example.com/post/a-post'
      const expected = [
        { uri: 'https://example.com/blog-feed.xml', hint: { key: 'wix:blog', label: 'Blog' } },
      ]

      expect(wixHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed under the site path of a free site', () => {
      const value = 'https://account.wixsite.com/mysite/post/hello'
      const expected = [
        {
          uri: 'https://account.wixsite.com/mysite/blog-feed.xml',
          hint: { key: 'wix:blog', label: 'Blog' },
        },
      ]

      expect(wixHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https blog feed of a free site opened over http', () => {
      const value = 'http://account.wixsite.com/mysite/post/hello'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://account.wixsite.com/mysite/blog-feed.xml',
          hint: { key: 'wix:blog', label: 'Blog' },
        },
      ]

      expect(wixHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a site on its own domain', () => {
      const value = 'http://www.example.com/post/a-post'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'http://www.example.com/blog-feed.xml', hint: { key: 'wix:blog', label: 'Blog' } },
      ]

      expect(wixHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for the blog feed of a free site', () => {
      const value = 'https://alice.wixsite.com/mysite/blog-feed.xml'
      const expected: DiscoverUriHint = { key: 'wix:blog', label: 'Blog' }

      expect(wixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for the blog feed over http', () => {
      const value = 'http://alice.wixsite.com/mysite/blog-feed.xml'
      const expected: DiscoverUriHint = { key: 'wix:blog', label: 'Blog' }

      expect(wixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for the blog feed under a language path', () => {
      const value = 'https://alice.wixsite.com/mysite/de/blog-feed.xml'
      const expected: DiscoverUriHint = { key: 'wix:blog', label: 'Blog' }

      expect(wixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for the blog feed under the blog path', () => {
      const value = 'https://alice.wixsite.com/mysite/blog/blog-feed.xml'
      const expected: DiscoverUriHint = { key: 'wix:blog', label: 'Blog' }

      expect(wixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for the blog feed with a language query', () => {
      const value = 'https://alice.wixsite.com/mysite/blog-feed.xml?lang=en'
      const expected: DiscoverUriHint = { key: 'wix:blog', label: 'Blog' }

      expect(wixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page of a free site', () => {
      const value = 'https://alice.wixsite.com/mysite/post/hello'

      expect(wixHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog feed at the root of a wixsite.com account', () => {
      const value = 'https://alice.wixsite.com/blog-feed.xml'

      expect(wixHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog feed on www.wixsite.com', () => {
      const value = 'https://www.wixsite.com/mysite/blog-feed.xml'

      expect(wixHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the blog feed of a custom domain', () => {
      const value = 'https://www.example.com/blog-feed.xml'

      expect(wixHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const blogHint: DiscoverUriHint = { key: 'wix:blog', label: 'Blog' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.wixsite.com/mysite/blog-feed.xml', blogHint],
      ['http://alice.wixsite.com/mysite/blog-feed.xml', blogHint],
      ['https://alice.wixsite.com/mysite/blog-feed.xml/', blogHint],
      ['https://alice.wixsite.com/mysite/blog-feed.xml?lang=en', blogHint],
      ['https://alice.wixsite.com/mysite/de/blog-feed.xml', blogHint],
      ['https://alice.wixsite.com/mysite/blog/blog-feed.xml', blogHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [wixHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
