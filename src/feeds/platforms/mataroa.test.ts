import { describe, expect, it } from 'bun:test'
import { mataroaHandler } from './mataroa.js'

describe('mataroaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.mataroa.blog'],
      [true, 'https://blog.example.mataroa.blog'],
      [false, 'https://mataroa.blog'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(mataroaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(mataroaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://alice.mataroa.blog'
      const expected = [
        {
          uri: 'https://alice.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.mataroa.blog/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })
  })
})
