import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type HatenablogUrl, hatenablogHandler, parseHatenablogUrl } from './hatenablog.js'

describe('parseHatenablogUrl', () => {
  it('should return the category for a category page', () => {
    const expected: HatenablogUrl = { kind: 'category', category: 'tech' }

    expect(parseHatenablogUrl('https://example.hatenablog.com/archive/category/tech')).toEqual(
      expected,
    )
  })

  it('should return the author for an author page', () => {
    const expected: HatenablogUrl = { kind: 'author', author: 'jane' }

    expect(parseHatenablogUrl('https://example.hatenablog.com/archive/author/jane')).toEqual(
      expected,
    )
  })

  it('should return the blog for an entry whose slug starts with category', () => {
    const value = 'https://mmll.hatenablog.com/entry/category/css/collapse-list'
    const expected: HatenablogUrl = { kind: 'blog' }

    expect(parseHatenablogUrl(value)).toEqual(expected)
  })

  it('should return the blog for an entry whose slug starts with archive', () => {
    const value = 'https://taxtax.hatenablog.jp/entry/archive/category/list'
    const expected: HatenablogUrl = { kind: 'blog' }

    expect(parseHatenablogUrl(value)).toEqual(expected)
  })

  it('should return the blog for any other page', () => {
    const expected: HatenablogUrl = { kind: 'blog' }

    expect(parseHatenablogUrl('https://example.hatenablog.com/entry/2024/01/01')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseHatenablogUrl('https://example.com/')).toBeUndefined()
  })
})

describe('hatenablogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.hatenablog.com'],
      [true, 'https://example.hatenablog.jp'],
      [true, 'https://example.hateblo.jp'],
      [true, 'https://example.hatenadiary.com'],
      [true, 'https://example.hatenadiary.jp'],
      [true, 'https://example.hatenadiary.org'],
      [false, 'https://blog.example.hatenablog.com'],
      [false, 'https://hatenablog.com'],
      [false, 'https://www.hatenablog.com'],
      [false, 'https://hatenablog.jp'],
      [false, 'https://hateblo.jp'],
      [false, 'https://hatenadiary.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hatenablogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hatenablogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Hatena Blog', () => {
      expect(hatenablogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the category feed for a capitalized archive segment', () => {
      const value = 'https://example.hatenablog.com/Archive/category/programming'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.hatenablog.com/rss/category/programming',
          hint: { key: 'hatenablog:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed/category/programming',
          hint: { key: 'hatenablog:category', label: 'Category', format: 'atom' },
        },
        {
          uri: 'https://example.hatenablog.com/rss',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(hatenablogHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS and Atom feed URLs for blog', () => {
      const value = 'https://example.hatenablog.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.hatenablog.com/rss',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(hatenablogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for hatenablog.jp domain', () => {
      const value = 'https://example.hatenablog.jp/entry/2024/01/01'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.hatenablog.jp/rss',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.jp/feed',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(hatenablogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for hateblo.jp domain', () => {
      const value = 'https://example.hateblo.jp'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.hateblo.jp/rss',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.hateblo.jp/feed',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(hatenablogHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feeds and main feeds for category page', () => {
      const value = 'https://example.hatenablog.com/archive/category/programming'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.hatenablog.com/rss/category/programming',
          hint: { key: 'hatenablog:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed/category/programming',
          hint: { key: 'hatenablog:category', label: 'Category', format: 'atom' },
        },
        {
          uri: 'https://example.hatenablog.com/rss',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(hatenablogHandler.resolve(value)).toEqual(expected)
    })

    it('should return author feeds and main feeds for author page', () => {
      const value = 'https://example.hatenablog.com/archive/author/tanaka'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.hatenablog.com/rss/author/tanaka',
          hint: { key: 'hatenablog:author', label: 'Author', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed/author/tanaka',
          hint: { key: 'hatenablog:author', label: 'Author', format: 'atom' },
        },
        {
          uri: 'https://example.hatenablog.com/rss',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(hatenablogHandler.resolve(value)).toEqual(expected)
    })

    it('should return author feeds and main feeds for author page with a capitalized archive segment', () => {
      const value = 'https://example.hatenablog.com/Archive/author/tanaka'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.hatenablog.com/rss/author/tanaka',
          hint: { key: 'hatenablog:author', label: 'Author', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed/author/tanaka',
          hint: { key: 'hatenablog:author', label: 'Author', format: 'atom' },
        },
        {
          uri: 'https://example.hatenablog.com/rss',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.hatenablog.com/feed',
          hint: { key: 'hatenablog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(hatenablogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an RSS feed', () => {
      const value = 'https://staff.hatenablog.com/rss'
      const expected = 'hatenablog:posts'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an Atom feed', () => {
      const value = 'https://staff.hatenablog.com/feed'
      const expected = 'hatenablog:posts'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the category key for a percent-encoded RSS category feed', () => {
      const value = 'https://staff.hatenablog.com/rss/category/%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B'
      const expected = 'hatenablog:category'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the category key for a percent-encoded Atom category feed', () => {
      const value = 'https://246west.hatenablog.com/feed/category/%E3%81%8A%E7%B1%B3'
      const expected = 'hatenablog:category'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the category key for a category with a dot in its name', () => {
      const value = 'https://usagi.hatenablog.jp/rss/category/Newtonsoft.Json'
      const expected = 'hatenablog:category'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the author key for an RSS author feed', () => {
      const value = 'https://forestwisteria.hatenablog.com/rss/author/forestwisteria'
      const expected = 'hatenablog:author'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the author key for an Atom author feed', () => {
      const value = 'https://blog.hatenablog.com/feed/author/hatenablog-editors'
      const expected = 'hatenablog:author'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the author key for a feed on hatenadiary.jp', () => {
      const value = 'https://konifar-zatsu.hatenadiary.jp/rss/author/konifar'
      const expected = 'hatenablog:author'

      expect(hatenablogHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a category page', () => {
      const value =
        'https://staff.hatenablog.com/archive/category/%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B'

      expect(hatenablogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an entry whose slug starts with category', () => {
      const value = 'https://mmll.hatenablog.com/entry/category/css/collapse-list'

      expect(hatenablogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.hatenablog.com/rss'

      expect(hatenablogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://hatenablog.com/rss'

      expect(hatenablogHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss'

      expect(hatenablogHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://staff.hatenablog.com/rss', { key: 'hatenablog:posts', label: 'Posts' }],
      ['https://staff.hatenablog.com/feed', { key: 'hatenablog:posts', label: 'Posts' }],
      [
        'https://staff.hatenablog.com/rss/category/%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B',
        { key: 'hatenablog:category', label: 'Category' },
      ],
      [
        'https://246west.hatenablog.com/feed/category/%E3%81%8A%E7%B1%B3',
        { key: 'hatenablog:category', label: 'Category' },
      ],
      [
        'https://forestwisteria.hatenablog.com/rss/author/forestwisteria',
        { key: 'hatenablog:author', label: 'Author' },
      ],
      [
        'https://blog.hatenablog.com/feed/author/hatenablog-editors',
        { key: 'hatenablog:author', label: 'Author' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [hatenablogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
