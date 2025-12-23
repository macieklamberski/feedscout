import { describe, expect, it } from 'bun:test'
import { devtoHandler } from './devto.js'

describe('devtoHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://dev.to/thepracticaldev', true],
      ['https://www.dev.to/thepracticaldev', true],
      ['https://example.com/thepracticaldev', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(devtoHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://dev.to/thepracticaldev'
      const expected = ['https://dev.to/feed/thepracticaldev']

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://dev.to/t/javascript'
      const expected = ['https://dev.to/feed/tag/javascript']

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const excludedUrls = [
        'https://dev.to/about',
        'https://dev.to/search',
        'https://dev.to/top',
        'https://dev.to/latest',
        'https://dev.to/settings',
      ]

      for (const url of excludedUrls) {
        expect(devtoHandler.resolve(url)).toEqual([])
      }
    })

    it('should handle usernames with underscores', () => {
      const value = 'https://dev.to/some_user'
      const expected = ['https://dev.to/feed/some_user']

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should handle trailing slash in user profile URL', () => {
      const value = 'https://dev.to/thepracticaldev/'
      const expected = ['https://dev.to/feed/thepracticaldev']

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths with subpaths', () => {
      const value = 'https://dev.to/thepracticaldev/some-article'

      expect(devtoHandler.resolve(value)).toEqual([])
    })
  })
})
