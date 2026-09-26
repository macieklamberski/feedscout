import { describe, expect, it } from 'bun:test'
import { ghostHandler } from './ghost.js'

describe('ghostHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.ghost.io'],
      [true, 'https://blog.example.ghost.io'],
      [false, 'https://ghost.io'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(ghostHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(ghostHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://alice.ghost.io'
      const expected = [
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page', () => {
      const value = 'https://alice.ghost.io/tag/getting-started'
      const expected = [
        {
          uri: 'https://alice.ghost.io/tag/getting-started/rss/',
          hint: { key: 'ghost:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page with a capitalized tag segment', () => {
      const value = 'https://alice.ghost.io/Tag/getting-started'
      const expected = [
        {
          uri: 'https://alice.ghost.io/tag/getting-started/rss/',
          hint: { key: 'ghost:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return author and blog feeds for author page', () => {
      const value = 'https://alice.ghost.io/author/ghost'
      const expected = [
        {
          uri: 'https://alice.ghost.io/author/ghost/rss/',
          hint: { key: 'ghost:author', label: 'Author' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return author and blog feeds for author page with a capitalized author segment', () => {
      const value = 'https://alice.ghost.io/Author/ghost'
      const expected = [
        {
          uri: 'https://alice.ghost.io/author/ghost/rss/',
          hint: { key: 'ghost:author', label: 'Author' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.ghost.io/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })
  })
})
