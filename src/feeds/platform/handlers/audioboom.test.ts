import { describe, expect, it } from 'bun:test'
import { audioboomHandler } from './audioboom.js'

describe('audioboomHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://audioboom.com/channels/5071123'],
      [true, 'https://www.audioboom.com/channels/5071123'],
      [true, 'https://audioboom.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(audioboomHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(audioboomHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return podcast feed for channel', () => {
      const value = 'https://audioboom.com/channels/5071123'
      const expected = [
        {
          uri: 'https://audioboom.com/channels/5071123.rss',
          hint: { key: 'audioboom:podcast', label: 'Podcast' },
        },
      ]

      expect(audioboomHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://audioboom.com/channels/5071123/some-episode'
      const expected = [
        {
          uri: 'https://audioboom.com/channels/5071123.rss',
          hint: { key: 'audioboom:podcast', label: 'Podcast' },
        },
      ]

      expect(audioboomHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://audioboom.com/'

      expect(audioboomHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for non-channel paths', () => {
      const value = 'https://audioboom.com/posts/12345'

      expect(audioboomHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
