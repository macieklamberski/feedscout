import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseSeesaaUrl, type SeesaaUrl, seesaaHandler } from './seesaa.js'

describe('parseSeesaaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: SeesaaUrl = { kind: 'blog' }

    expect(parseSeesaaUrl('https://example.seesaa.net/')).toEqual(expected)
  })

  const otherDomainBlogs = [
    'https://example.iiblog.jp/',
    'https://example.seesaa.blog/',
    'https://example.seesaa.space/',
    'https://example.sokuho.org/',
    'http://example.stablo.jp/',
    'https://example.xblog.jp/',
  ]

  it.each(otherDomainBlogs)('should return the blog for %s', (value) => {
    const expected: SeesaaUrl = { kind: 'blog' }

    expect(parseSeesaaUrl(value)).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSeesaaUrl('https://seesaa.net/')).toBeUndefined()
  })

  it('should return undefined for the apex of another domain', () => {
    expect(parseSeesaaUrl('https://seesaa.space/')).toBeUndefined()
  })

  it('should return undefined for a blog image host', () => {
    expect(parseSeesaaUrl('https://example.up.seesaa.net/image/photo.jpg')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseSeesaaUrl('https://www.seesaa.net/')).toBeUndefined()
  })

  const nestedSubdomainValues: Array<string> = [
    'https://example.s.seesaa.net/',
    'https://blog.example.seesaa.net/',
  ]

  it.each(nestedSubdomainValues)('should return undefined for a nested subdomain %s', (value) => {
    expect(parseSeesaaUrl(value)).toBeUndefined()
  })

  it('should return undefined for a domain ending in xblog.jp', () => {
    expect(parseSeesaaUrl('https://example.exblog.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSeesaaUrl('https://example.com/')).toBeUndefined()
  })
})

describe('seesaaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.seesaa.net'],
      [false, 'https://blog.example.seesaa.net'],
      [false, 'https://seesaa.net'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(seesaaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(seesaaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Seesaa', () => {
      expect(seesaaHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS 2.0 and RDF feeds for blog', () => {
      const value = 'https://alice.seesaa.net'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.seesaa.net/index20.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.seesaa.net/index.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://alice.seesaa.net/article/123.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.seesaa.net/index20.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.seesaa.net/index.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of the page', () => {
      const value = 'http://alice.stablo.jp/article/123.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.stablo.jp/index20.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.stablo.jp/index.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS 2.0 feed', () => {
      const value = 'https://alice.seesaa.net/index20.rdf'
      const expected = 'seesaa:posts'

      expect(seesaaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RDF feed', () => {
      const value = 'https://alice.seesaa.net/index.rdf'
      const expected = 'seesaa:posts'

      expect(seesaaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for a podcast RSS feed', () => {
      const value = 'https://alice.seesaa.space/index_custom.rdf'
      const expected = 'seesaa:posts'

      expect(seesaaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an http feed on another domain', () => {
      const value = 'http://alice.stablo.jp/index20.rdf'
      const expected = 'seesaa:posts'

      expect(seesaaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for an article page', () => {
      const value = 'https://alice.seesaa.net/article/123.html'

      expect(seesaaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a blog image host', () => {
      const value = 'https://alice.up.seesaa.net/index.rdf'

      expect(seesaaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex', () => {
      const value = 'https://seesaa.net/index.rdf'

      expect(seesaaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the www host', () => {
      const value = 'https://www.seesaa.net/index.rdf'

      expect(seesaaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/index.rdf'

      expect(seesaaHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.seesaa.net/index20.rdf', { key: 'seesaa:posts', label: 'Posts' }],
      ['http://alice.seesaa.net/index.rdf', { key: 'seesaa:posts', label: 'Posts' }],
      ['https://alice.seesaa.space/index_custom.rdf', { key: 'seesaa:posts', label: 'Posts' }],
      ['http://alice.stablo.jp/index.rdf', { key: 'seesaa:posts', label: 'Posts' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [seesaaHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
