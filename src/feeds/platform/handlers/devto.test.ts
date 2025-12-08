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
      const value = devtoHandler.resolve('https://dev.to/username')

      expect(value).toEqual(['https://dev.to/feed/username'])
    })

    it('should return feed URL for tag page', () => {
      const value = devtoHandler.resolve('https://dev.to/t/javascript')

      expect(value).toEqual(['https://dev.to/feed/tag/javascript'])
    })

    it('should skip reserved paths', () => {
      const value = devtoHandler.resolve('https://dev.to/search')

      expect(value).toEqual([])
    })

    it('should skip settings paths', () => {
      const value = devtoHandler.resolve('https://dev.to/settings')

      expect(value).toEqual([])
    })
  })
})
