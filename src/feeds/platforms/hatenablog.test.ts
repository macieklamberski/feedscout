import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { hatenablogHandler } from './hatenablog.js'

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
  })
})
