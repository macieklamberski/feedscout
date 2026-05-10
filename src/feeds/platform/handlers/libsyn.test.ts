import { describe, expect, it } from 'bun:test'
import { libsynHandler } from './libsyn.js'

describe('libsynHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://podcastingforcoaches.libsyn.com', true],
      ['https://blog.example.libsyn.com', true],
      ['https://libsyn.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(libsynHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(libsynHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://podcastingforcoaches.libsyn.com'
      const expected = [
        {
          uri: 'https://podcastingforcoaches.libsyn.com/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://podcastingforcoaches.libsyn.com/website'
      const expected = [
        {
          uri: 'https://podcastingforcoaches.libsyn.com/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve show ID for feeds.libsyn.com canonical URL', () => {
      const value = 'https://feeds.libsyn.com/113039/rss'
      const expected = [
        {
          uri: 'https://feeds.libsyn.com/113039/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve show ID for feeds.libsyn.com without /rss suffix', () => {
      const value = 'https://feeds.libsyn.com/113039'
      const expected = [
        {
          uri: 'https://feeds.libsyn.com/113039/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })
  })
})
