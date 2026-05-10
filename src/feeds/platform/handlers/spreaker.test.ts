import { describe, expect, it } from 'bun:test'
import { spreakerHandler } from './spreaker.js'

describe('spreakerHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.spreaker.com/podcast/spreaker-live-show--1433865', true],
      ['https://spreaker.com/podcast/my-show--12345', true],
      ['https://spreaker.com', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(spreakerHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(spreakerHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://www.spreaker.com/podcast/spreaker-live-show--1433865'
      const expected = [
        {
          uri: 'https://www.spreaker.com/show/1433865/episodes/feed',
          hint: { key: 'spreaker:podcast', label: 'Podcast' },
        },
      ]

      expect(spreakerHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://www.spreaker.com/podcast/spreaker-live-show--1433865/episodes/456'
      const expected = [
        {
          uri: 'https://www.spreaker.com/show/1433865/episodes/feed',
          hint: { key: 'spreaker:podcast', label: 'Podcast' },
        },
      ]

      expect(spreakerHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://www.spreaker.com/'

      expect(spreakerHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for paths without podcast ID', () => {
      const value = 'https://www.spreaker.com/podcast/my-show'

      expect(spreakerHandler.resolve(value)).toEqual([])
    })
  })
})
