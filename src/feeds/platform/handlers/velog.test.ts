import { describe, expect, it } from 'bun:test'
import { velogHandler } from './velog.js'

describe('velogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://velog.io/@velopert'],
      [true, 'https://www.velog.io/@user'],
      [true, 'https://velog.io'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(velogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(velogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://velog.io/@velopert'
      const expected = [
        {
          uri: 'https://v2.velog.io/rss/velopert',
          hint: { key: 'velog:posts', label: 'Posts' },
        },
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://velog.io/@velopert/some-post-slug'
      const expected = [
        {
          uri: 'https://v2.velog.io/rss/velopert',
          hint: { key: 'velog:posts', label: 'Posts' },
        },
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for root path', () => {
      const value = 'https://velog.io/'
      const expected = [
        {
          uri: 'https://v2.velog.io/rss',
          hint: { key: 'velog:trending', label: 'Trending' },
        },
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths without @ prefix', () => {
      const value = 'https://velog.io/trending'

      expect(velogHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
