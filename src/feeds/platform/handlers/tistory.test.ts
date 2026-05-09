import { describe, expect, it } from 'bun:test'
import { tistoryHandler } from './tistory.js'

describe('tistoryHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://headstartup.tistory.com', true],
      ['https://blog.example.tistory.com', true],
      ['https://tistory.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
