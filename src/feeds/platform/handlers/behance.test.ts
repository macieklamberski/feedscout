import { describe, expect, it } from 'bun:test'
import { behanceHandler } from './behance.js'

describe('behanceHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.behance.net/johndoe', true],
      ['https://behance.net/johndoe', true],
      ['https://www.behance.net/', true],
      ['https://www.behance.net/search', true],
      ['https://example.com/behance', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(behanceHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return XML feed for user profile', () => {
      const value = 'https://www.behance.net/johndoe'
      const expected = ['https://www.behance.net/johndoe.xml']

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should handle mixed case usernames', () => {
      const value = 'https://www.behance.net/JohnDoe'
      const expected = ['https://www.behance.net/JohnDoe.xml']

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should handle trailing slash', () => {
      const value = 'https://www.behance.net/johndoe/'
      const expected = ['https://www.behance.net/johndoe.xml']

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://www.behance.net/search',
        'https://www.behance.net/galleries',
        'https://www.behance.net/blog',
        'https://www.behance.net/about',
      ]

      for (const value of values) {
        expect(behanceHandler.resolve(value)).toEqual([])
      }
    })

    it('should return empty array for homepage', () => {
      const value = 'https://www.behance.net/'

      expect(behanceHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for nested paths', () => {
      const value = 'https://www.behance.net/johndoe/projects'

      expect(behanceHandler.resolve(value)).toEqual([])
    })
  })
})
