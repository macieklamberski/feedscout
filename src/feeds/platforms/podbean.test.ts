import { describe, expect, it } from 'bun:test'
import { podbeanHandler } from './podbean.js'

describe('podbeanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.podbean.com'],
      [true, 'https://blog.example.podbean.com'],
      [false, 'https://podbean.com'],
      [false, 'https://example.com'],
      [false, 'https://www.podbean.com'],
      [false, 'https://support.podbean.com'],
      [false, 'https://feed.podbean.com'],
      [false, 'https://pbcdn1.podbean.com'],
      [false, 'https://sponsorship.podbean.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(podbeanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(podbeanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://alice.podbean.com'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.podbean.com/e/some-episode'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(podbeanHandler.resolve('https://podbean.com/')).toEqual([])
    })
  })
})
