import { describe, expect, it } from 'bun:test'
import { ghostHandler } from './ghost.js'

describe('ghostHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://demo.ghost.io', true],
      ['https://blog.example.ghost.io', true],
      ['https://ghost.io', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(ghostHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(ghostHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://demo.ghost.io'
      const expected = [
        {
          uri: 'https://demo.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page', () => {
      const value = 'https://demo.ghost.io/tag/getting-started'
      const expected = [
        {
          uri: 'https://demo.ghost.io/tag/getting-started/rss/',
          hint: { key: 'ghost:tag', label: 'Tag' },
        },
        {
          uri: 'https://demo.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return author and blog feeds for author page', () => {
      const value = 'https://demo.ghost.io/author/ghost'
      const expected = [
        {
          uri: 'https://demo.ghost.io/author/ghost/rss/',
          hint: { key: 'ghost:author', label: 'Author' },
        },
        {
          uri: 'https://demo.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://demo.ghost.io/some-article-slug'
      const expected = [
        {
          uri: 'https://demo.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })
  })
})
