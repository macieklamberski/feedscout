import { describe, expect, it } from 'bun:test'
import { velogHandler } from './velog.js'

describe('velogHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://velog.io/@velopert', true],
      ['https://www.velog.io/@user', true],
      ['https://velog.io', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
