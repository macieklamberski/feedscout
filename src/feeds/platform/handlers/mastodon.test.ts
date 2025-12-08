import { describe, expect, it } from 'bun:test'
import { mastodonHandler } from './mastodon.js'

describe('mastodonHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://mastodon.social/@user', true],
      ['https://hachyderm.io/@user', true],
      ['https://fosstodon.org/@user', true],
      ['https://mastodon.social/about', false],
      ['https://twitter.com/@user', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(mastodonHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://mastodon.social/@username'
      const expected = ['https://mastodon.social/@username.rss']

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should handle profiles with subpaths', () => {
      const value = 'https://fosstodon.org/@user/123456'
      const expected = ['https://fosstodon.org/@user.rss']

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      const value = 'https://mastodon.social/explore'
      const expected: Array<string> = []

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })
  })
})
