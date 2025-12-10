import { describe, expect, it } from 'bun:test'
import { devtoHandler } from './devto.js'

describe('devtoHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://dev.to/username', true],
      ['https://www.dev.to/username', true],
      ['https://hashnode.dev/username', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(devtoHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user profile', () => {
      const value = 'https://dev.to/username'
      const expected = ['https://dev.to/feed/username']

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for tag page', () => {
      const value = 'https://dev.to/t/javascript'
      const expected = ['https://dev.to/feed/tag/javascript']

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://dev.to/search'
      const expected: Array<string> = []

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for settings paths', () => {
      const value = 'https://dev.to/settings'
      const expected: Array<string> = []

      expect(devtoHandler.resolve(value)).toEqual(expected)
    })
  })
})
