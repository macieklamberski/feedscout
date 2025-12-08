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
      const value = mediumHandler.resolve('https://medium.com/@username')

      expect(value).toEqual(['https://medium.com/feed/@username'])
    })

    it('should return feed URL for publication', () => {
      const value = mediumHandler.resolve('https://medium.com/towards-data-science')

      expect(value).toEqual(['https://medium.com/feed/towards-data-science'])
    })

    it('should return feed URL for custom subdomain', () => {
      const value = mediumHandler.resolve('https://blog.medium.com')

      expect(value).toEqual(['https://medium.com/feed/blog'])
    })

    it('should skip reserved paths', () => {
      const value = mediumHandler.resolve('https://medium.com/tag/programming')

      expect(value).toEqual([])
    })

    it('should return empty array for non-matching paths', () => {
      const value = mediumHandler.resolve('https://medium.com/me/settings')

      expect(value).toEqual([])
    })
  })
})
