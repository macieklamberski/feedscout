import { describe, expect, it } from 'bun:test'
import { listedHandler } from './listed.js'

describe('listedHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://listed.to/@Listed', true],
      ['https://www.listed.to/@user', true],
      ['https://listed.to', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(listedHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(listedHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://listed.to/@Listed'
      const expected = [
        {
          uri: 'https://listed.to/@Listed/feed.rss',
          hint: { key: 'listed:blog', label: 'Blog' },
        },
      ]

      expect(listedHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://listed.to/@Listed/some-post-slug'
      const expected = [
        {
          uri: 'https://listed.to/@Listed/feed.rss',
          hint: { key: 'listed:blog', label: 'Blog' },
        },
      ]

      expect(listedHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://listed.to/'

      expect(listedHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for paths without @ prefix', () => {
      const value = 'https://listed.to/about'

      expect(listedHandler.resolve(value)).toEqual([])
    })
  })
})
