import { describe, expect, it } from 'bun:test'
import { deviantartHandler } from './deviantart.js'

describe('deviantartHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://deviantart.com/yuumei'],
      [true, 'https://www.deviantart.com/yuumei'],
      [false, 'https://example.com/yuumei'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(deviantartHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(deviantartHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://deviantart.com/yuumei'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Ayuumei%20sort%3Atime%20meta%3Aall',
          hint: { key: 'deviantart:deviations', label: 'Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user gallery', () => {
      const value = 'https://www.deviantart.com/yuumei/gallery'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Ayuumei%20sort%3Atime%20meta%3Aall',
          hint: { key: 'deviantart:deviations', label: 'Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user gallery/all', () => {
      const value = 'https://deviantart.com/yuumei/gallery/all'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Ayuumei%20sort%3Atime%20meta%3Aall',
          hint: { key: 'deviantart:deviations', label: 'Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for specific gallery folder', () => {
      const value = 'https://deviantart.com/yuumei/gallery/123456/folder-name'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery%3Ayuumei%2F123456',
          hint: { key: 'deviantart:gallery', label: 'Gallery' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for favourites', () => {
      const value = 'https://deviantart.com/yuumei/favourites'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=favby%3Ayuumei',
          hint: { key: 'deviantart:favorites', label: 'Favorites' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://deviantart.com/tag/photography'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag%3Aphotography',
          hint: { key: 'deviantart:tag', label: 'Tag' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for journal page', () => {
      const value = 'https://deviantart.com/yuumei/journal'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=journal%3Ayuumei',
          hint: { key: 'deviantart:journal', label: 'Journal' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for specific journal post', () => {
      const value = 'https://deviantart.com/yuumei/journal/some-post-slug'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=journal%3Ayuumei',
          hint: { key: 'deviantart:journal', label: 'Journal' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    const excludedValues: Array<string> = [
      'https://deviantart.com/about',
      'https://deviantart.com/join',
      'https://deviantart.com/search',
      'https://deviantart.com/shop',
    ]

    it.each(excludedValues)('should return empty array for %s', (value) => {
      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should return curated daily-deviations feed', () => {
      const value = 'https://deviantart.com/daily-deviations'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=special%3Add',
          hint: { key: 'deviantart:daily-deviations', label: 'Daily Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return popular feed', () => {
      const value = 'https://deviantart.com/popular'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=boost%3Apopular',
          hint: { key: 'deviantart:popular', label: 'Popular' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated daily-deviations feed for trailing slash', () => {
      const value = 'https://deviantart.com/daily-deviations/'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=special%3Add',
          hint: { key: 'deviantart:daily-deviations', label: 'Daily Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return popular feed for trailing slash', () => {
      const value = 'https://deviantart.com/popular/'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=boost%3Apopular',
          hint: { key: 'deviantart:popular', label: 'Popular' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for gallery folder with excluded path', () => {
      const value = 'https://deviantart.com/about/gallery/123456/folder-name'

      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for favourites with excluded path', () => {
      const value = 'https://deviantart.com/about/favourites'

      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for journal with excluded path', () => {
      const value = 'https://deviantart.com/about/journal'

      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should handle usernames with underscores and hyphens', () => {
      const value = 'https://deviantart.com/some_user-name'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Asome_user-name%20sort%3Atime%20meta%3Aall',
          hint: { key: 'deviantart:deviations', label: 'Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
