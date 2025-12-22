import { describe, expect, it } from 'bun:test'
import { mastodonHandler } from './mastodon.js'

describe('mastodonHandler', () => {
  describe('match', () => {
    it('should match known Mastodon instances with user profiles', () => {
      const urls = [
        'https://mastodon.social/@Gargron',
        'https://fosstodon.org/@kev',
        'https://hachyderm.io/@user',
      ]

      for (const url of urls) {
        expect(mastodonHandler.match(url)).toBe(true)
      }
    })

    it('should match known instances with hashtag pages', () => {
      const value = 'https://mastodon.social/tags/javascript'

      expect(mastodonHandler.match(value)).toBe(true)
    })

    it('should match instances with common naming patterns', () => {
      const urls = [
        'https://mastodon.example.com/@user',
        'https://mstdn.example.com/@user',
        'https://social.example.com/@user',
        'https://toot.example.com/@user',
      ]

      for (const url of urls) {
        expect(mastodonHandler.match(url)).toBe(true)
      }
    })

    it('should not match non-Mastodon URLs', () => {
      const urls = [
        'https://twitter.com/@user',
        'https://example.com/@user',
        'https://mastodon.social/about',
      ]

      for (const url of urls) {
        expect(mastodonHandler.match(url)).toBe(false)
      }
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://mastodon.social/@Gargron'
      const expected = ['https://mastodon.social/@Gargron.rss']

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for hashtag page', () => {
      const value = 'https://mastodon.social/tags/javascript'
      const expected = ['https://mastodon.social/tags/javascript.rss']

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should handle different instances', () => {
      const value = 'https://fosstodon.org/@kev'
      const expected = ['https://fosstodon.org/@kev.rss']

      expect(mastodonHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-matching paths', () => {
      const value = 'https://mastodon.social/about'

      expect(mastodonHandler.resolve(value)).toEqual([])
    })
  })
})
