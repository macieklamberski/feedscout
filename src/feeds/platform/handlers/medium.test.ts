import { describe, expect, it } from 'bun:test'
import { mediumHandler } from './medium.js'

describe('mediumHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://medium.com/@user', true],
      ['https://www.medium.com/@user', true],
      ['https://blog.medium.com', true],
      ['https://substack.com/@user', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(mediumHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user profile', () => {
      const value = 'https://medium.com/@username'
      const expected = ['https://medium.com/feed/@username']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for publication', () => {
      const value = 'https://medium.com/towards-data-science'
      const expected = ['https://medium.com/feed/towards-data-science']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for custom subdomain', () => {
      const value = 'https://blog.medium.com'
      const expected = ['https://medium.com/feed/blog']

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://medium.com/tag/programming'
      const expected: Array<string> = []

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-matching paths', () => {
      const value = 'https://medium.com/me/settings'
      const expected: Array<string> = []

      expect(mediumHandler.resolve(value)).toEqual(expected)
    })
  })
})
