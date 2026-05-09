import { describe, expect, it } from 'bun:test'
import { buzzsproutHandler } from './buzzsprout.js'

describe('buzzsproutHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.buzzsprout.com/1765577', true],
      ['https://buzzsprout.com/1765577', true],
      ['https://buzzsprout.com', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(buzzsproutHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(buzzsproutHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
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
