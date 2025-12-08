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
      const value = substackHandler.resolve('https://example.substack.com')

      expect(value).toEqual(['https://example.substack.com/feed'])
    })

    it('should return feed URL regardless of path', () => {
      const value = substackHandler.resolve('https://newsletter.substack.com/p/some-article')

      expect(value).toEqual(['https://newsletter.substack.com/feed'])
    })
  })
})
