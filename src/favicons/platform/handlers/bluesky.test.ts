import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { blueskyHandler } from './bluesky.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('blueskyHandler', () => {
  describe('match', () => {
    it('should match bsky.app profile URLs', () => {
      expect(blueskyHandler.match('https://bsky.app/profile/user.bsky.social')).toBe(true)
    })

    it('should match www.bsky.app profile URLs', () => {
      expect(blueskyHandler.match('https://www.bsky.app/profile/user.bsky.social')).toBe(true)
    })

    it('should match custom domain handles', () => {
      expect(blueskyHandler.match('https://bsky.app/profile/example.com')).toBe(true)
    })

    it('should match profile URLs with extra path segments', () => {
      expect(blueskyHandler.match('https://bsky.app/profile/user.bsky.social/posts')).toBe(true)
    })

    it('should not match non-profile paths', () => {
      expect(blueskyHandler.match('https://bsky.app/about')).toBe(false)
      expect(blueskyHandler.match('https://bsky.app/')).toBe(false)
    })

    it('should not match profile path without handle', () => {
      expect(blueskyHandler.match('https://bsky.app/profile')).toBe(false)
    })

    it('should not match non-bsky URLs', () => {
      expect(blueskyHandler.match('https://example.com/profile/user')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(blueskyHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve avatar from Bluesky API', async () => {
      const avatarUrl = 'https://cdn.bsky.app/img/avatar/plain/did:plc:abc123/avatar.jpg'
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
          JSON.stringify({ avatar: avatarUrl }),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        '',
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

      expect(value).toEqual(expected)
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const value = await blueskyHandler.resolve('https://bsky.app/profile/user.bsky.social', '')

      expect(value).toEqual([])
    })

    it('should return empty array when API returns no avatar', async () => {
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
          JSON.stringify({}),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        '',
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns invalid JSON', async () => {
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
          'not json',
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        '',
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when fetch throws', async () => {
      const mockFetch: DiscoverFetchFn = async () => {
        throw new Error('Network error')
      }
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        '',
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should handle custom domain handles', async () => {
      const avatarUrl = 'https://cdn.bsky.app/img/avatar/plain/did:plc:xyz/avatar.jpg'
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=example.com':
          JSON.stringify({ avatar: avatarUrl }),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/example.com',
        '',
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

      expect(value).toEqual(expected)
    })
  })
})
