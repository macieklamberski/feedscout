import { describe, expect, it } from 'bun:test'
import { libsynHandler } from './libsyn.js'

describe('libsynHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://podcastingforcoaches.libsyn.com'],
      [true, 'https://blog.example.libsyn.com'],
      [false, 'https://libsyn.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
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

    it('should return empty array for feeds.libsyn.com without numeric show ID', () => {
      const value = 'https://feeds.libsyn.com/something-non-numeric'

      expect(libsynHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
