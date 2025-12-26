import { describe, expect, it } from 'bun:test'
import { deviantartHandler } from './deviantart.js'

describe('deviantartHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://deviantart.com/yuumei', true],
      ['https://www.deviantart.com/yuumei', true],
      ['https://example.com/yuumei', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(deviantartHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://deviantart.com/yuumei'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Ayuumei%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user gallery', () => {
      const value = 'https://www.deviantart.com/yuumei/gallery'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Ayuumei%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user gallery/all', () => {
      const value = 'https://deviantart.com/yuumei/gallery/all'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Ayuumei%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for specific gallery folder', () => {
      const value = 'https://deviantart.com/yuumei/gallery/123456/folder-name'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery%3Ayuumei%2F123456',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for favourites', () => {
      const value = 'https://deviantart.com/yuumei/favourites'
      const expected = ['https://backend.deviantart.com/rss.xml?type=deviation&q=favby%3Ayuumei']

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://deviantart.com/tag/photography'
      const expected = ['https://backend.deviantart.com/rss.xml?type=deviation&q=tag%3Aphotography']

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const excludedUrls = [
        'https://deviantart.com/about',
        'https://deviantart.com/join',
        'https://deviantart.com/search',
        'https://deviantart.com/shop',
      ]

      for (const url of excludedUrls) {
        expect(deviantartHandler.resolve(url)).toEqual([])
      }
    })

    it('should return empty array for gallery folder with excluded path', () => {
      const value = 'https://deviantart.com/about/gallery/123456/folder-name'

      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for favourites with excluded path', () => {
      const value = 'https://deviantart.com/about/favourites'

      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should handle usernames with underscores and hyphens', () => {
      const value = 'https://deviantart.com/some_user-name'
      const expected = [
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Asome_user-name%20sort%3Atime%20meta%3Aall',
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })
  })
})
