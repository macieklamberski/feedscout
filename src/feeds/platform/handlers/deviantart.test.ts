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
      const value = deviantartHandler.resolve('https://www.deviantart.com/artistname')

      expect(value).toEqual([
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartistname%20sort%3Atime%20meta%3Aall',
      ])
    })

    it('should return RSS feed URL for user gallery', () => {
      const value = deviantartHandler.resolve('https://www.deviantart.com/artistname/gallery')

      expect(value).toEqual([
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartistname%20sort%3Atime%20meta%3Aall',
      ])
    })

    it('should return RSS feed URL for gallery subfolder', () => {
      const value = deviantartHandler.resolve(
        'https://www.deviantart.com/artistname/gallery/12345/folder-name',
      )

      expect(value).toEqual([
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartistname%20sort%3Atime%20meta%3Aall',
      ])
    })

    it('should handle usernames with numbers and underscores', () => {
      const value = deviantartHandler.resolve('https://www.deviantart.com/artist_123')

      expect(value).toEqual([
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aartist_123%20sort%3Atime%20meta%3Aall',
      ])
    })

    it('should return empty array for system paths', () => {
      expect(deviantartHandler.resolve('https://www.deviantart.com/about')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/search')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/join')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/tag')).toEqual([])
      expect(deviantartHandler.resolve('https://www.deviantart.com/developers')).toEqual([])
    })

    it('should return empty array for root path', () => {
      const value = deviantartHandler.resolve('https://www.deviantart.com/')

      expect(value).toEqual([])
    })
  })
})
