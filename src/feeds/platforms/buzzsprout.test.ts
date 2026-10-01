import { describe, expect, it } from 'bun:test'
import { type BuzzsproutUrl, buzzsproutHandler, parseBuzzsproutUrl } from './buzzsprout.js'

describe('parseBuzzsproutUrl', () => {
  it('should return the podcast for a podcast page', () => {
    const expected: BuzzsproutUrl = { kind: 'podcast', podcastId: '1765577' }

    expect(parseBuzzsproutUrl('https://www.buzzsprout.com/1765577')).toEqual(expected)
  })

  it('should return undefined for a path that is not a podcast id', () => {
    expect(parseBuzzsproutUrl('https://www.buzzsprout.com/features')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBuzzsproutUrl('https://example.com/1765577')).toBeUndefined()
  })
})

describe('buzzsproutHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.buzzsprout.com/1765577'],
      [true, 'https://buzzsprout.com/1765577'],
      [false, 'https://buzzsprout.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(buzzsproutHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(buzzsproutHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(buzzsproutHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast', () => {
      const value = 'https://www.buzzsprout.com/1765577'
      const expected = [
        {
          uri: 'https://rss.buzzsprout.com/1765577.rss',
          hint: { key: 'buzzsprout:podcast', label: 'Podcast' },
        },
      ]

      expect(buzzsproutHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://www.buzzsprout.com/1765577/episodes/some-episode'
      const expected = [
        {
          uri: 'https://rss.buzzsprout.com/1765577.rss',
          hint: { key: 'buzzsprout:podcast', label: 'Podcast' },
        },
      ]

      expect(buzzsproutHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://www.buzzsprout.com/'

      expect(buzzsproutHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for non-numeric paths', () => {
      const value = 'https://www.buzzsprout.com/about'

      expect(buzzsproutHandler.resolve(value)).toEqual([])
    })
  })
})
