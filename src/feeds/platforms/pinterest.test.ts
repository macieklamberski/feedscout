import { describe, expect, it } from 'bun:test'
import { pinterestHandler } from './pinterest.js'

describe('pinterestHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.pinterest.com/nasa'],
      [true, 'https://pinterest.com/nasa'],
      [true, 'https://www.pinterest.com/nasa/mars'],
      [true, 'https://pin.it/abc123'],
      [false, 'https://example.com/pinterest'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(pinterestHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(pinterestHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return user feed for profile page', () => {
      const value = 'https://www.pinterest.com/nasa'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for profile with trailing slash', () => {
      const value = 'https://www.pinterest.com/nasa/'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return board feed for /{user}/{board}', () => {
      const value = 'https://www.pinterest.com/nasa/mars'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/mars.rss',
          hint: { key: 'pinterest:board', label: 'Board' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return board feed for /{user}/{board} with trailing slash', () => {
      const value = 'https://www.pinterest.com/nasa/space-exploration/'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/space-exploration.rss',
          hint: { key: 'pinterest:board', label: 'Board' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for pins page', () => {
      const value = 'https://www.pinterest.com/nasa/pins'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for boards page', () => {
      const value = 'https://www.pinterest.com/nasa/boards'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for saved page', () => {
      const value = 'https://www.pinterest.com/nasa/_saved'
      const expected = [
        {
          uri: 'https://www.pinterest.com/nasa/feed.rss',
          hint: { key: 'pinterest:pins', label: 'Pins' },
        },
      ]

      expect(pinterestHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://www.pinterest.com/search/pins',
        'https://www.pinterest.com/ideas',
        'https://www.pinterest.com/today',
        'https://www.pinterest.com/explore',
        'https://www.pinterest.com/_',
        'https://www.pinterest.com/about',
        'https://www.pinterest.com/business',
        'https://www.pinterest.com/convert',
        'https://www.pinterest.com/login',
        'https://www.pinterest.com/news_hub',
        'https://www.pinterest.com/password',
        'https://www.pinterest.com/privacy',
        'https://www.pinterest.com/resource',
        'https://www.pinterest.com/settings',
        'https://www.pinterest.com/terms',
        'https://www.pinterest.com/topics',
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

    it.todo('should define resolve behavior for pin.it short links', () => {
      // pin.it short codes are redirect tokens, not usernames, but resolve currently
      // emits https://www.pinterest.com/{code}/feed.rss for them; likely needs a fix.
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
