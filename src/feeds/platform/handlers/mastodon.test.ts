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
      const value = mastodonHandler.resolve('https://mastodon.social/@username')

      expect(value).toEqual(['https://mastodon.social/@username.rss'])
    })

    it('should handle profiles with subpaths', () => {
      const value = mastodonHandler.resolve('https://fosstodon.org/@user/123456')

      expect(value).toEqual(['https://fosstodon.org/@user.rss'])
    })

    it('should return empty array for non-profile paths', () => {
      const value = mastodonHandler.resolve('https://mastodon.social/explore')

      expect(value).toEqual([])
    })
  })
})
