import { describe, expect, it } from 'bun:test'
import { mastodonHandler } from './mastodon.js'

describe('mastodonHandler', () => {
  describe('match', () => {
    const cases = [
      // Known instances.
      ['https://mastodon.social/@user', true],
      ['https://hachyderm.io/@user', true],
      ['https://fosstodon.org/@user', true],
      ['https://chaos.social/@user', true],
      ['https://ruby.social/@user', true],
      // Pattern-based matching.
      ['https://mastodon.xyz/@user', true],
      ['https://social.example.com/@user', true],
      ['https://toot.example.org/@user', true],
      // Hashtag pages.
      ['https://mastodon.social/tags/programming', true],
      // Non-matching.
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

    it('should return RSS feed URL for hashtag', () => {
      const value = 'https://mastodon.social/tags/programming'
      const expected = ['https://mastodon.social/tags/programming.rss']

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      const value = 'https://mastodon.social/explore'
      const expected: Array<string> = []

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })
  })
})
