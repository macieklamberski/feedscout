import { describe, expect, it } from 'bun:test'
import { substackHandler } from './substack.js'

describe('substackHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.substack.com', true],
      ['https://blog.example.substack.com', true],
      ['https://substack.com/@govtrackus', true],
      ['https://substack.com/@theconsciouslee', true],
      ['https://substack.com/@user-name', true],
      ['https://substack.com/home', false],
      ['https://substack.com', false],
      ['https://medium.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(substackHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(substackHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for newsletter', () => {
      const value = 'https://example.substack.com'
      const expected = [
        {
          uri: 'https://example.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://newsletter.substack.com/p/some-article'
      const expected = [
        {
          uri: 'https://newsletter.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for profile page', () => {
      const value = 'https://substack.com/@govtrackus'
      const expected = [
        {
          uri: 'https://govtrackus.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for profile page with subpath', () => {
      const value = 'https://substack.com/@theconsciouslee/recommendations'
      const expected = [
        {
          uri: 'https://theconsciouslee.substack.com/feed',
          hint: { key: 'substack:newsletter', label: 'Newsletter' },
        },
      ]

      expect(substackHandler.resolve(value)).toEqual(expected)
    })
  })
})
