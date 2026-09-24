import { describe, expect, it } from 'bun:test'
import { spreakerHandler } from './spreaker.js'

describe('spreakerHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.spreaker.com/podcast/spreaker-live-show--1433865'],
      [true, 'https://spreaker.com/podcast/my-show--12345'],
      [true, 'https://spreaker.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
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

    it('should return feed URL for bare /show/{id} numeric path', () => {
      const value = 'https://www.spreaker.com/show/1433865'
      const expected = [
        {
          uri: 'https://www.spreaker.com/show/1433865/episodes/feed',
          hint: { key: 'spreaker:podcast', label: 'Podcast' },
        },
      ]

      expect(spreakerHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for /show/{id} with deeper path', () => {
      const value = 'https://www.spreaker.com/show/1433865/episodes'
      const expected = [
        {
          uri: 'https://www.spreaker.com/show/1433865/episodes/feed',
          hint: { key: 'spreaker:podcast', label: 'Podcast' },
        },
      ]

      expect(spreakerHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
