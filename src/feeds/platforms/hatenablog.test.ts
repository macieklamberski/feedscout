import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
      [true, 'https://blog.example.hatenablog.com'],
      [false, 'https://hatenablog.com'],
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
})
