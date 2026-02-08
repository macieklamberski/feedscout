import { describe, expect, it } from 'bun:test'
import { blueskyHandler } from './bluesky.js'

describe('blueskyHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://bsky.app/profile/user.bsky.social', true],
      ['https://twitter.com/user', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(blueskyHandler.match(url)).toBe(expected)
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
  })
})
