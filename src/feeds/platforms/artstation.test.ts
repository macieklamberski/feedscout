import { describe, expect, it } from 'bun:test'
import { artstationHandler } from './artstation.js'

describe('artstationHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.artstation.com/alice'],
      [true, 'https://artstation.com/user'],
      [true, 'https://artstation.com'],
      [true, 'https://alice.artstation.com'],
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
      const value = 'https://www.artstation.com/alice'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://www.artstation.com/alice/albums/all'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for subdomain form', () => {
      const value = 'https://alice.artstation.com'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for subdomain form regardless of subpath', () => {
      const value = 'https://alice.artstation.com/albums/all'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
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
          uri: 'https://www.artstation.com/artwork.rss?sorting=latest',
          hint: { key: 'artstation:artwork-latest', label: 'Artwork (Latest)' },
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
          uri: 'https://www.artstation.com/artwork.rss?sorting=latest',
          hint: { key: 'artstation:artwork-latest', label: 'Artwork (Latest)' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return global artwork feeds for /artwork page with a capitalized artwork segment', () => {
      const value = 'https://www.artstation.com/Artwork'
      const expected = [
        {
          uri: 'https://www.artstation.com/artwork.rss',
          hint: { key: 'artstation:artwork', label: 'Artwork' },
        },
        {
          uri: 'https://www.artstation.com/artwork.rss?sorting=latest',
          hint: { key: 'artstation:artwork-latest', label: 'Artwork (Latest)' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://www.artstation.com/jobs'

      expect(artstationHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for a capitalized excluded path', () => {
      const value = 'https://www.artstation.com/Jobs'

      expect(artstationHandler.resolve(value)).toEqual([])
    })
  })
})
