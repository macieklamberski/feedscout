import { describe, expect, it } from 'bun:test'
import { deviantartHandler } from './deviantart.js'

describe('deviantartHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://deviantart.com/artist', true],
      ['https://www.deviantart.com/artist', true],
      ['https://www.deviantart.com/artist/gallery', true],
      ['https://twitter.com/user', false],
      ['https://artstation.com/artist', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(deviantartHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://www.deviantart.com/artistname'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartistname%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user gallery', () => {
      const value = 'https://www.deviantart.com/artistname/gallery'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartistname%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return folder-specific RSS feed URL for gallery subfolder', () => {
      const value = 'https://www.deviantart.com/artistname/gallery/12345/folder-name'
      const expected = ['https://backend.deviantart.com/rss.xml?q=gallery%3Aartistname%2F12345']

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return folder-specific RSS feed URL for gallery subfolder without name', () => {
      const value = 'https://www.deviantart.com/artistname/gallery/67890'
      const expected = ['https://backend.deviantart.com/rss.xml?q=gallery%3Aartistname%2F67890']

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return user gallery feed for /gallery/all path', () => {
      const value = 'https://www.deviantart.com/artistname/gallery/all'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartistname%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should handle usernames with numbers and underscores', () => {
      const value = 'https://www.deviantart.com/artist_123'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartist_123%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(deviantartHandler.resolve('https://www.deviantart.com/about')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/search')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/join')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/tag')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/developers')).toEqual([])
    })

    it('should return empty array for root path', () => {
      const value = 'https://www.deviantart.com/'
      const expected: Array<string> = []

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })
  })
})
