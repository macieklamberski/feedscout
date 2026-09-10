import { describe, expect, it } from 'bun:test'
import { exblogHandler } from './exblog.js'

describe('exblogHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://petitcc.exblog.jp', true],
      ['https://blog.example.exblog.jp', true],
      ['https://exblog.jp', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
