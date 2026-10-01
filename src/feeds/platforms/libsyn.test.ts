import { describe, expect, it } from 'bun:test'
import { type LibsynUrl, libsynHandler, parseLibsynUrl } from './libsyn.js'

describe('parseLibsynUrl', () => {
  it('should return the feed for a feeds host show', () => {
    const expected: LibsynUrl = { kind: 'feed', showId: '12345' }

    expect(parseLibsynUrl('https://feeds.libsyn.com/12345')).toEqual(expected)
  })

  it('should return undefined for a feeds host page without a numeric show', () => {
    expect(parseLibsynUrl('https://feeds.libsyn.com/about')).toBeUndefined()
  })

  it('should return the podcast for a show subdomain', () => {
    const expected: LibsynUrl = { kind: 'podcast' }

    expect(parseLibsynUrl('https://myshow.libsyn.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseLibsynUrl('https://example.com/')).toBeUndefined()
  })
})

describe('libsynHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.libsyn.com'],
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
    it('should return empty array for a URL outside Libsyn', () => {
      expect(libsynHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast', () => {
      const value = 'https://alice.libsyn.com'
      const expected = [
        {
          uri: 'https://alice.libsyn.com/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.libsyn.com/website'
      const expected = [
        {
          uri: 'https://alice.libsyn.com/rss',
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
  })
})
