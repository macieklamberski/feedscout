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

    it('should return RSS 2.0, RDF and podcast feeds for blog', () => {
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
        {
          uri: 'https://alice.seesaa.net/index_custom.rdf',
          hint: { key: 'seesaa:podcast', label: 'Podcast', format: 'rss' },
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
        {
          uri: 'https://alice.seesaa.net/index_custom.rdf',
          hint: { key: 'seesaa:podcast', label: 'Podcast', format: 'rss' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds for an http page', () => {
      const value = 'http://alice.seesaa.net/article/123.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.seesaa.net/index20.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.seesaa.net/index.rdf',
          hint: { key: 'seesaa:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://alice.seesaa.net/index_custom.rdf',
          hint: { key: 'seesaa:podcast', label: 'Podcast', format: 'rss' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })

    it('should return http feeds for a stablo.jp blog', () => {
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
        {
          uri: 'http://alice.stablo.jp/index_custom.rdf',
          hint: { key: 'seesaa:podcast', label: 'Podcast', format: 'rss' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a podcast feed under another top-level domain', () => {
      const value = 'https://alice.seesaa.space/index_custom.rdf'
      const expected: DiscoverUriHint = {
        key: 'seesaa:podcast',
        label: 'Podcast',
        format: 'rss',
      }

      expect(seesaaHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return an http RDF posts feed on stablo.jp as itself', async () => {
      const value = 'http://alice.stablo.jp/index.rdf'
      const options = {
        ...defaultPlatformOptions,
        handlers: [seesaaHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: {
            key: 'seesaa:posts',
            label: 'Posts',
            format: 'rdf',
          },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
