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
  })

  describe('resolve', () => {
    it('should return empty array for the blog portal', () => {
      const value = 'https://blog.shinobi.jp/'

      expect(shinobiHandler.resolve(value)).toEqual([])
    })

    it('should return RSS and Atom feeds for blog', () => {
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
      ]

      expect(shinobiHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS and Atom feeds for a blog on a Ninja Blog domain off the list', () => {
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
      ]

      expect(shinobiHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for the RSS feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the Atom feed', () => {
      const value = 'https://example.blog.shinobi.jp/ATOM/'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'atom' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the Atom feed as its self link spells it', () => {
      const value = 'http://example.blog.shinobi.jp/atom'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'atom' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS 2.0 feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/200'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS 0.91 feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/091'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS 1.0 feed', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/100'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rdf' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS feed under the RSS path', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/RSS'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS 2.0 feed under the RSS path', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/200/RSS'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS 1.0 feed under the RSS path', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/100/RSS'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rdf' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS 0.91 feed as index.rdf', () => {
      const value = 'https://example.blog.shinobi.jp/RSS/091/index.rdf'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for the RSS feed at the OPML path', () => {
      const value = 'https://example.blog.shinobi.jp/OPML'
      const expected: DiscoverUriHint = { key: 'shinobi:posts', label: 'Posts', format: 'rss' }

      expect(shinobiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for an entry page', () => {
      const value = 'https://example.blog.shinobi.jp/Entry/1/'

      expect(shinobiHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the blog portal', () => {
      const value = 'https://blog.shinobi.jp/RSS/'

      expect(shinobiHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.example.blog.shinobi.jp/RSS/'

      expect(shinobiHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a Ninja Blog domain off the list', () => {
      const value = 'https://example.3rin.net/RSS/'

      expect(shinobiHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/RSS/'

      expect(shinobiHandler.getFeedHint?.(value)).toBeUndefined()
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
      ]

      expect(result).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.blog.shinobi.jp/RSS/',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://example.blog.shinobi.jp/ATOM/',
        { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'http://example.blog.shinobi.jp/atom',
        { key: 'shinobi:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS/200',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS/091/',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS/100',
        { key: 'shinobi:posts', label: 'Posts', format: 'rdf' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS/RSS',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS/200/RSS',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS/100/RSS',
        { key: 'shinobi:posts', label: 'Posts', format: 'rdf' },
      ],
      [
        'https://example.blog.shinobi.jp/RSS/091/index.rdf',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.blog.shinobi.jp/OPML',
        { key: 'shinobi:posts', label: 'Posts', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
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
