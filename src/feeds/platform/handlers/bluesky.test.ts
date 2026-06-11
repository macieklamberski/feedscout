import { describe, expect, it } from 'bun:test'
import { blueskyHandler } from './bluesky.js'

describe('blueskyHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://bsky.app/profile/user.bsky.social'],
      [true, 'https://www.bsky.app/profile/user.bsky.social'],
      [false, 'https://twitter.com/user'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(blueskyHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(blueskyHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return native RSS feed URL for profile', () => {
      const value = 'https://bsky.app/profile/user.bsky.social'
      const expected = [
        {
          uri: 'https://bsky.app/profile/user.bsky.social/rss',
          hint: { key: 'bluesky:posts', label: 'Posts' },
        },
      ]

      expect(blueskyHandler.resolve(value)).toEqual(expected)
    })

    it('should handle custom domain handles', () => {
      const value = 'https://bsky.app/profile/example.com'
      const expected = [
        {
          uri: 'https://bsky.app/profile/example.com/rss',
          hint: { key: 'bluesky:posts', label: 'Posts' },
        },
      ]

      expect(blueskyHandler.resolve(value)).toEqual(expected)
    })

    it('should handle DID-based profile URLs', () => {
      const value = 'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur'
      const expected = [
        {
          uri: 'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/rss',
          hint: { key: 'bluesky:posts', label: 'Posts' },
        },
      ]

      expect(blueskyHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      const value = 'https://bsky.app/about'

      expect(blueskyHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for /profile/ without handle', () => {
      const value = 'https://bsky.app/profile/'

      expect(blueskyHandler.resolve(value)).toEqual([])
    })

    it('should resolve /profile/user/post/123 using first segment as handle', () => {
      const value = 'https://bsky.app/profile/user.bsky.social/post/123'
      const expected = [
        {
          uri: 'https://bsky.app/profile/user.bsky.social/rss',
          hint: { key: 'bluesky:posts', label: 'Posts' },
        },
      ]

      expect(blueskyHandler.resolve(value)).toEqual(expected)
    })

    it('should resolve /profile/user/followers using first segment as handle', () => {
      const value = 'https://bsky.app/profile/user.bsky.social/followers'
      const expected = [
        {
          uri: 'https://bsky.app/profile/user.bsky.social/rss',
          hint: { key: 'bluesky:posts', label: 'Posts' },
        },
      ]

      expect(blueskyHandler.resolve(value)).toEqual(expected)
    })

    it('should return native RSS feed URL for www profile', () => {
      const value = 'https://www.bsky.app/profile/user.bsky.social'
      const expected = [
        {
          uri: 'https://bsky.app/profile/user.bsky.social/rss',
          hint: { key: 'bluesky:posts', label: 'Posts' },
        },
      ]

      expect(blueskyHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
