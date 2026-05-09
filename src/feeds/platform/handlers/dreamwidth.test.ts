import { describe, expect, it } from 'bun:test'
import { dreamwidthHandler } from './dreamwidth.js'

describe('dreamwidthHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://news.dreamwidth.org', true],
      ['https://blog.example.dreamwidth.org', true],
      ['https://dreamwidth.org', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(dreamwidthHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(dreamwidthHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS and Atom feeds for blog', () => {
      const value = 'https://news.dreamwidth.org'
      const expected = [
        {
          uri: 'https://news.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://news.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://news.dreamwidth.org/123456.html'
      const expected = [
        {
          uri: 'https://news.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://news.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })
  })
})
