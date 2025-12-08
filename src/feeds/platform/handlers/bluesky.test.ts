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
    it('should return RSS bridge feed URL for profile', () => {
      const value = blueskyHandler.resolve('https://bsky.app/profile/user.bsky.social')

      expect(value).toEqual(['https://bsky.link/api/rss/user.bsky.social'])
    })

    it('should handle custom domain handles', () => {
      const value = blueskyHandler.resolve('https://bsky.app/profile/example.com')

      expect(value).toEqual(['https://bsky.link/api/rss/example.com'])
    })

    it('should return empty array for non-profile paths', () => {
      const value = blueskyHandler.resolve('https://bsky.app/about')

      expect(value).toEqual([])
    })
  })
})
