import { describe, expect, it } from 'bun:test'
import { mediumHandler } from './medium.js'

describe('mediumHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://medium.com/@ev', true],
      ['https://www.medium.com/@ev', true],
      ['https://medium.com/towards-data-science', true],
      ['https://blog.medium.com', true],
      ['https://example.com/@ev', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(mediumHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://medium.com/@ev'
      const expected = ['https://medium.com/feed/@ev']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication', () => {
      const value = 'https://medium.com/towards-data-science'
      const expected = ['https://medium.com/feed/towards-data-science']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for subdomain publication', () => {
      const value = 'https://blog.medium.com/some-article'
      const expected = ['https://medium.com/feed/blog']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://medium.com/tag/javascript'
      const expected = ['https://medium.com/feed/tag/javascript']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const excludedUrls = [
        'https://medium.com/search',
        'https://medium.com/me',
        'https://medium.com/new-story',
        'https://medium.com/plans',
      ]

      for (const url of excludedUrls) {
        expect(mediumHandler.resolve(url)).toEqual([])
      }
    })

    it('should return empty array for root path', () => {
      const value = 'https://medium.com/'

      expect(mediumHandler.resolve(value)).toEqual([])
    })

    it('should handle user profile with article path', () => {
      const value = 'https://medium.com/@ev/some-article'
      const expected = ['https://medium.com/feed/@ev']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for publication on www.medium.com', () => {
      const value = 'https://www.medium.com/towards-data-science'
      const expected = ['https://medium.com/feed/towards-data-science']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })
  })
})
