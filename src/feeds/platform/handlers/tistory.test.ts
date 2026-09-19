import { describe, expect, it } from 'bun:test'
import { tistoryHandler } from './tistory.js'

describe('tistoryHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://headstartup.tistory.com'],
      [true, 'https://blog.example.tistory.com'],
      [false, 'https://tistory.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(tistoryHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(tistoryHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://headstartup.tistory.com'
      const expected = [
        {
          uri: 'https://headstartup.tistory.com/rss',
          hint: { key: 'tistory:blog', label: 'Blog' },
        },
      ]

      expect(tistoryHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://headstartup.tistory.com/123'
      const expected = [
        {
          uri: 'https://headstartup.tistory.com/rss',
          hint: { key: 'tistory:blog', label: 'Blog' },
        },
      ]

      expect(tistoryHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
