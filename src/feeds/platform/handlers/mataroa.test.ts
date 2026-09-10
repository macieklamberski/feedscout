import { describe, expect, it } from 'bun:test'
import { mataroaHandler } from './mataroa.js'

describe('mataroaHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://hey.mataroa.blog', true],
      ['https://blog.example.mataroa.blog', true],
      ['https://mataroa.blog', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(mataroaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(mataroaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://hey.mataroa.blog'
      const expected = [
        {
          uri: 'https://hey.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://hey.mataroa.blog/some-article-slug'
      const expected = [
        {
          uri: 'https://hey.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })
  })
})
