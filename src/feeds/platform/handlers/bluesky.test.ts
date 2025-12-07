import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { blueskyHandler } from './bluesky.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

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
    it('should return RSS bridge feed URL for profile', async () => {
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        createMockFetch(),
      )

      expect(value).toEqual(['https://bsky.link/api/rss/user.bsky.social'])
    })

    it('should handle custom domain handles', async () => {
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/example.com',
        createMockFetch(),
      )

      expect(value).toEqual(['https://bsky.link/api/rss/example.com'])
    })

    it('should return empty array for non-profile paths', async () => {
      const value = await blueskyHandler.resolve('https://bsky.app/about', createMockFetch())

      expect(value).toEqual([])
    })
  })
})
