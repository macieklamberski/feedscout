import { describe, expect, it } from 'bun:test'
import { hashnodeHandler } from './hashnode.js'

describe('hashnodeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.hashnode.dev'],
      [true, 'https://blog.example.hashnode.dev'],
      [true, 'https://townhall.hashnode.com'],
      [false, 'https://hashnode.dev'],
      [false, 'https://hashnode.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hashnodeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hashnodeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://example.hashnode.dev'
      const expected = [
        {
          uri: 'https://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://example.hashnode.dev/some-article-slug'
      const expected = [
        {
          uri: 'https://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
