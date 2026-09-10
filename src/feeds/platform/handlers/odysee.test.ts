import { describe, expect, it } from 'bun:test'
import { odyseeHandler } from './odysee.js'

describe('odyseeHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://odysee.com/@veritasium:f', true],
      ['https://www.odysee.com/@lbry:3f', true],
      ['https://odysee.com', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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

    it('should return empty array for channel without claim ID', () => {
      const value = 'https://odysee.com/@veritasium'

      expect(odyseeHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for root path', () => {
      const value = 'https://odysee.com/'

      expect(odyseeHandler.resolve(value)).toEqual([])
    })
  })
})
