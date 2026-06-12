import { describe, expect, it } from 'bun:test'
import { artstationHandler } from './artstation.js'

describe('artstationHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.artstation.com/rossdraws'],
      [true, 'https://artstation.com/user'],
      [true, 'https://artstation.com'],
      [true, 'https://rossdraws.artstation.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(artstationHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(artstationHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for portfolio', () => {
      const value = 'https://www.artstation.com/rossdraws'
      const expected = [
        {
          uri: 'https://www.artstation.com/rossdraws.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://www.artstation.com/rossdraws/albums/all'
      const expected = [
        {
          uri: 'https://www.artstation.com/rossdraws.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for subdomain form', () => {
      const value = 'https://rossdraws.artstation.com'
      const expected = [
        {
          uri: 'https://www.artstation.com/rossdraws.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for subdomain form regardless of subpath', () => {
      const value = 'https://rossdraws.artstation.com/albums/all'
      const expected = [
        {
          uri: 'https://www.artstation.com/rossdraws.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return global artwork feeds for root path', () => {
      const value = 'https://www.artstation.com/'
      const expected = [
        {
          uri: 'https://www.artstation.com/artwork.rss',
          hint: { key: 'artstation:artwork', label: 'Artwork' },
        },
        {
          uri: 'https://www.artstation.com/artwork.rss?sorting=trending',
          hint: { key: 'artstation:artwork-trending', label: 'Artwork (Trending)' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return global artwork feeds for /artwork page', () => {
      const value = 'https://www.artstation.com/artwork'
      const expected = [
        {
          uri: 'https://www.artstation.com/artwork.rss',
          hint: { key: 'artstation:artwork', label: 'Artwork' },
        },
        {
          uri: 'https://www.artstation.com/artwork.rss?sorting=trending',
          hint: { key: 'artstation:artwork-trending', label: 'Artwork (Trending)' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://www.artstation.com/jobs'

      expect(artstationHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
