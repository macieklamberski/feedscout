import { describe, expect, it } from 'bun:test'
import { substackHandler } from './substack.js'

describe('substackHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.substack.com', true],
      ['https://blog.example.substack.com', true],
      ['https://medium.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(substackHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for newsletter', () => {
      const value = 'https://example.substack.com'
      const expected = ['https://example.substack.com/feed']

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://newsletter.substack.com/p/some-article'
      const expected = ['https://newsletter.substack.com/feed']

      expect(substackHandler.resolve(value)).toEqual(expected)
    })
  })
})
