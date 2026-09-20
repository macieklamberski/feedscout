import { describe, expect, it } from 'bun:test'
import { odyseeHandler } from './odysee.js'

describe('odyseeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://odysee.com/@veritasium:f'],
      [true, 'https://www.odysee.com/@lbry:3f'],
      [true, 'https://odysee.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(odyseeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(odyseeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for channel', () => {
      const value = 'https://odysee.com/@veritasium:f'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@veritasium:f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://odysee.com/@lbry:3f/some-video:abc'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@lbry:3f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve uppercase characters in channel and claim ID', () => {
      const value = 'https://odysee.com/@Veritasium:F'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@Veritasium:F',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for channel without claim ID', () => {
      const value = 'https://odysee.com/@veritasium'

      expect(odyseeHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for root path', () => {
      const value = 'https://odysee.com/'

      expect(odyseeHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
