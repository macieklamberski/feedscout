import { describe, expect, it } from 'bun:test'
import { behanceHandler } from './behance.js'

describe('behanceHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.behance.net/johndoe'],
      [true, 'https://behance.net/johndoe'],
      [true, 'https://www.behance.net/'],
      [true, 'https://www.behance.net/search'],
      [false, 'https://example.com/behance'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(behanceHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(behanceHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed for user profile', () => {
      const value = 'https://www.behance.net/johndoe'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/user?username=johndoe',
          hint: { key: 'behance:portfolio', label: 'Portfolio' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should handle mixed case usernames', () => {
      const value = 'https://www.behance.net/JohnDoe'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/user?username=JohnDoe',
          hint: { key: 'behance:portfolio', label: 'Portfolio' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should handle trailing slash', () => {
      const value = 'https://www.behance.net/johndoe/'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/user?username=johndoe',
          hint: { key: 'behance:portfolio', label: 'Portfolio' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return appreciated feed for appreciated page', () => {
      const value = 'https://www.behance.net/johndoe/appreciated'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/user?username=johndoe&content=appreciated',
          hint: { key: 'behance:appreciated', label: 'Appreciated' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    const excludedValues: Array<string> = [
      'https://www.behance.net/search',
      'https://www.behance.net/blog',
      'https://www.behance.net/about',
    ]

    it.each(excludedValues)('should return empty array for %s', (value) => {
      expect(behanceHandler.resolve(value)).toEqual([])
    })

    it('should return featured projects + Featured-by-Adobe feed for homepage', () => {
      const value = 'https://www.behance.net/'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: { key: 'behance:projects', label: 'Featured projects' },
        },
        {
          uri: 'https://feeds.feedburner.com/behance/vorr',
          hint: { key: 'behance:featured', label: 'Featured by Adobe' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured projects + Featured-by-Adobe feed for /galleries', () => {
      const value = 'https://www.behance.net/galleries'
      const expected = [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: { key: 'behance:projects', label: 'Featured projects' },
        },
        {
          uri: 'https://feeds.feedburner.com/behance/vorr',
          hint: { key: 'behance:featured', label: 'Featured by Adobe' },
        },
      ]

      expect(behanceHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for other nested paths', () => {
      const value = 'https://www.behance.net/johndoe/projects'

      expect(behanceHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
