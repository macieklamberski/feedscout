import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { mastodonHandler } from './mastodon.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

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
    it('should return RSS feed URL for user profile', async () => {
      const value = await mastodonHandler.resolve(
        'https://mastodon.social/@username',
        createMockFetch(),
      )

      expect(value).toEqual(['https://mastodon.social/@username.rss'])
    })

    it('should handle profiles with subpaths', async () => {
      const value = await mastodonHandler.resolve(
        'https://fosstodon.org/@user/123456',
        createMockFetch(),
      )

      expect(value).toEqual(['https://fosstodon.org/@user.rss'])
    })

    it('should return empty array for non-profile paths', async () => {
      const value = await mastodonHandler.resolve(
        'https://mastodon.social/explore',
        createMockFetch(),
      )

      expect(value).toEqual([])
    })
  })
})
