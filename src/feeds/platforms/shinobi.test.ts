import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isShinobiHtml, parseShinobiUrl, type ShinobiUrl, shinobiHandler } from './shinobi.js'

const bannerHtml = '<img alt="忍者ブログ" src="/admin/img/blogheader_logo.png" />'

describe('isShinobiHtml', () => {
  it('should return true for the banner logo', () => {
    expect(isShinobiHtml(bannerHtml)).toBe(true)
  })

  it('should return false for the banner logo on another host', () => {
    const value = '<img src="https://example.com/admin/img/blogheader_logo.png">'

    expect(isShinobiHtml(value)).toBe(false)
  })

  it('should return false for the banner logo path in a link', () => {
    const value = '<a href="/admin/img/blogheader_logo.png">Logo</a>'

    expect(isShinobiHtml(value)).toBe(false)
  })

  it('should return false for a link to the Ninja Blog home page', () => {
    const value = '<a href="//www.ninja.co.jp/blog/">忍者ブログ</a>'

    expect(isShinobiHtml(value)).toBe(false)
  })
})

describe('parseShinobiUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const value = 'https://example.blog.shinobi.jp/'
    const expected: ShinobiUrl = { kind: 'blog', blog: 'example' }

    expect(parseShinobiUrl(value)).toEqual(expected)
  })

  it('should return undefined for a Ninja Blog domain off the list', () => {
    const value = 'https://example.3rin.net/'

    expect(parseShinobiUrl(value)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    const value = 'https://example.com/'

    expect(parseShinobiUrl(value)).toBeUndefined()
  })

  it('should return undefined for the www subdomain', () => {
    const value = 'https://www.blog.shinobi.jp/'

    expect(parseShinobiUrl(value)).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    const value = 'https://www.example.blog.shinobi.jp/'

    expect(parseShinobiUrl(value)).toBeUndefined()
  })

  it('should return undefined for the blog portal', () => {
    const value = 'https://blog.shinobi.jp/'

    expect(parseShinobiUrl(value)).toBeUndefined()
  })
})

describe('shinobiHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.blog.shinobi.jp'],
      [true, 'https://another.blog.shinobi.jp/Entry/1/'],
      [false, 'https://example.3rin.net/'],
      [false, 'https://example.ninja.co.jp/'],
      [false, 'https://blog.shinobi.jp'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(shinobiHandler.match(url)).toBe(expected)
    })

    it('should return true for a blog on a Ninja Blog domain off the list carrying the marker', () => {
      const value = 'https://example.3rin.net/'

      expect(shinobiHandler.match(value, bannerHtml)).toBe(true)
    })

    it('should return false for a blog on a Ninja Blog domain off the list without the marker', () => {
      const value = 'https://example.3rin.net/'

      expect(shinobiHandler.match(value, '<html></html>')).toBe(false)
    })

    it('should return false for the blog portal carrying the marker', () => {
      const value = 'https://blog.shinobi.jp/'

      expect(shinobiHandler.match(value, bannerHtml)).toBe(false)
    })

    it('should return false for a nested subdomain carrying the marker', () => {
      const value = 'https://www.example.blog.shinobi.jp/'

      expect(shinobiHandler.match(value, bannerHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for the blog portal', () => {
      const value = 'https://blog.shinobi.jp/'

      expect(shinobiHandler.resolve(value)).toEqual([])
    })

    it('should return RSS, Atom and RSS 1.0 feeds for blog', () => {
      const value = 'https://example.blog.shinobi.jp/Entry/1/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.blog.shinobi.jp/RSS/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.blog.shinobi.jp/ATOM/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.blog.shinobi.jp/RSS/100/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(shinobiHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS, Atom and RSS 1.0 feeds for a blog on a Ninja Blog domain off the list', () => {
      const value = 'https://example.3rin.net/Entry/1/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.3rin.net/RSS/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.3rin.net/ATOM/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.3rin.net/RSS/100/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(shinobiHandler.resolve(value, bannerHtml)).toEqual(expected)
    })

    it('should keep the scheme of the request', () => {
      const value = 'http://example.blog.shinobi.jp/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.blog.shinobi.jp/RSS/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://example.blog.shinobi.jp/ATOM/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://example.blog.shinobi.jp/RSS/100/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(shinobiHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for the RSS feed at the OPML path', () => {
      const value = 'https://example.blog.shinobi.jp/OPML'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('pages through the Platform method', () => {
    it('should return the feeds of a blog on a Ninja Blog domain off the list', async () => {
      const value = 'https://example.3rin.net/Entry/1/'
      const result = await discoverUrisFromPlatform(bannerHtml, undefined, {
        ...defaultPlatformOptions,
        handlers: [shinobiHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.3rin.net/RSS/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.3rin.net/ATOM/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.3rin.net/RSS/100/',
          hint: { key: 'shinobi:posts', label: 'Posts', format: 'rdf' },
        },
      ]

      expect(result).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return the RSS feed at the OPML path as itself', async () => {
      const value = 'https://example.blog.shinobi.jp/OPML'
      const hint: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [shinobiHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
