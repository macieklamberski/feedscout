import { describe, expect, it } from 'bun:test'
import { pinterestHandler } from './pinterest.js'

describe('pinterestHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.pinterest.com/nasa', true],
      ['https://pinterest.com/nasa', true],
      ['https://www.pinterest.com/nasa/mars', true],
      ['https://pin.it/abc123', true],
      ['https://example.com/pinterest', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(pinterestHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return user feed for profile page', () => {
      const value = 'https://www.pinterest.com/nasa'
      const expected = ['https://www.pinterest.com/nasa/feed.rss']

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for profile with trailing slash', () => {
      const value = 'https://www.pinterest.com/nasa/'
      const expected = ['https://www.pinterest.com/nasa/feed.rss']

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return board feed for board page', () => {
      const value = 'https://www.pinterest.com/nasa/mars'
      const expected = ['https://www.pinterest.com/nasa/mars.rss']

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return board feed for board with trailing slash', () => {
      const value = 'https://www.pinterest.com/nasa/space-exploration/'
      const expected = ['https://www.pinterest.com/nasa/space-exploration.rss']

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for pins page', () => {
      const value = 'https://www.pinterest.com/nasa/pins'
      const expected = ['https://www.pinterest.com/nasa/feed.rss']

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for boards page', () => {
      const value = 'https://www.pinterest.com/nasa/boards'
      const expected = ['https://www.pinterest.com/nasa/feed.rss']

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for saved page', () => {
      const value = 'https://www.pinterest.com/nasa/_saved'
      const expected = ['https://www.pinterest.com/nasa/feed.rss']

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://www.pinterest.com/search/pins',
        'https://www.pinterest.com/ideas',
        'https://www.pinterest.com/today',
        'https://www.pinterest.com/explore',
      ]

      for (const value of values) {
        expect(pinterestHandler.resolve(value)).toEqual([])
      }
    })

    it('should return empty array for homepage', () => {
      const value = 'https://www.pinterest.com/'

      expect(pinterestHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for pin page', () => {
      const value = 'https://www.pinterest.com/pin/123456789'

      expect(pinterestHandler.resolve(value)).toEqual([])
    })
  })
})
