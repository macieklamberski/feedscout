import { describe, expect, it } from 'bun:test'
import { exblogHandler } from './exblog.js'

describe('exblogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://petitcc.exblog.jp'],
      [true, 'https://blog.example.exblog.jp'],
      [false, 'https://exblog.jp'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(exblogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(exblogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS and Atom feeds for blog', () => {
      const value = 'https://petitcc.exblog.jp'
      const expected = [
        {
          uri: 'https://petitcc.exblog.jp/index.xml',
          hint: { key: 'exblog:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://petitcc.exblog.jp/atom.xml',
          hint: { key: 'exblog:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(exblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feeds for category page', () => {
      const value = 'https://petitcc.exblog.jp/i2'
      const expected = [
        {
          uri: 'https://petitcc.exblog.jp/i2/index.xml',
          hint: { key: 'exblog:category-rss', label: 'Category (RSS)' },
        },
        {
          uri: 'https://petitcc.exblog.jp/i2/atom.xml',
          hint: { key: 'exblog:category-atom', label: 'Category (Atom)' },
        },
        {
          uri: 'https://petitcc.exblog.jp/index.xml',
          hint: { key: 'exblog:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://petitcc.exblog.jp/atom.xml',
          hint: { key: 'exblog:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(exblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://petitcc.exblog.jp/30123456/'
      const expected = [
        {
          uri: 'https://petitcc.exblog.jp/index.xml',
          hint: { key: 'exblog:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://petitcc.exblog.jp/atom.xml',
          hint: { key: 'exblog:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(exblogHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
