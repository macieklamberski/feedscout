import { describe, expect, it } from 'bun:test'
import { pagecordHandler } from './pagecord.js'

describe('pagecordHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://unfiltered.pagecord.com'],
      [true, 'https://blog.example.pagecord.com'],
      [false, 'https://pagecord.com'],
      [false, 'https://www.pagecord.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(pagecordHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(pagecordHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://unfiltered.pagecord.com'
      const expected = [
        {
          uri: 'https://unfiltered.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://unfiltered.pagecord.com/some-post-slug'
      const expected = [
        {
          uri: 'https://unfiltered.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
