import { describe, expect, it } from 'bun:test'
import { paragraphHandler } from './paragraph.js'

describe('paragraphHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://paragraph.com/@blog'],
      [true, 'https://www.paragraph.com/@user'],
      [true, 'https://paragraph.com/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(paragraphHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(paragraphHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user blog', () => {
      const value = 'https://paragraph.com/@blog'
      const expected = [
        {
          uri: 'https://api.paragraph.com/blogs/rss/@blog',
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://paragraph.com/@optimism/some-post-slug'
      const expected = [
        {
          uri: 'https://api.paragraph.com/blogs/rss/@optimism',
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for www subdomain', () => {
      const value = 'https://www.paragraph.com/@user'
      const expected = [
        {
          uri: 'https://api.paragraph.com/blogs/rss/@user',
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://paragraph.com/'

      expect(paragraphHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for paths without @ prefix', () => {
      const value = 'https://paragraph.com/about'

      expect(paragraphHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
