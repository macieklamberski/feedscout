import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { blueskyHandler, isProfilePath } from './bluesky.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('isProfilePath', () => {
  it('should return true for /profile/handle paths', () => {
    expect(isProfilePath('/profile/user.bsky.social')).toBe(true)
    expect(isProfilePath('/profile/example.com')).toBe(true)
  })

  it('should return true for /profile/handle with extra segments', () => {
    expect(isProfilePath('/profile/user.bsky.social/posts')).toBe(true)
    expect(isProfilePath('/profile/user.bsky.social/followers')).toBe(true)
  })

  it('should return true for /profile/handle with trailing slash', () => {
    expect(isProfilePath('/profile/user.bsky.social/')).toBe(true)
  })

  it('should return false for /profile without handle', () => {
    expect(isProfilePath('/profile')).toBe(false)
    expect(isProfilePath('/profile/')).toBe(false)
  })

  it('should return false for non-profile paths', () => {
    expect(isProfilePath('/about')).toBe(false)
    expect(isProfilePath('/settings')).toBe(false)
  })

  it('should return false for case variation of /profile', () => {
    expect(isProfilePath('/Profile/user.bsky.social')).toBe(false)
    expect(isProfilePath('/PROFILE/user.bsky.social')).toBe(false)
  })

  it('should return false for root path', () => {
    expect(isProfilePath('/')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isProfilePath('')).toBe(false)
  })
})

describe('blueskyHandler', () => {
  describe('match', () => {
    it('should match bsky.app profile URLs', () => {
      expect(blueskyHandler.match('https://bsky.app/profile/user.bsky.social')).toBe(true)
    })

    it('should match www.bsky.app profile URLs', () => {
      expect(blueskyHandler.match('https://www.bsky.app/profile/user.bsky.social')).toBe(true)
    })

    it('should match profile URLs with extra path segments', () => {
      expect(blueskyHandler.match('https://bsky.app/profile/user.bsky.social/posts')).toBe(true)
    })

    it('should not match non-profile paths', () => {
      expect(blueskyHandler.match('https://bsky.app/about')).toBe(false)
      expect(blueskyHandler.match('https://bsky.app/')).toBe(false)
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
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
          JSON.stringify({
            avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:abc123/avatar.jpg',
          }),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://cdn.bsky.app/img/avatar/plain/did:plc:abc123/avatar.jpg' },
      ]

      expect(value).toEqual(expected)
    })

    it('should resolve avatar for custom domain handle', async () => {
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=example.com':
          JSON.stringify({
            avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:xyz/avatar.jpg',
          }),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/example.com',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://cdn.bsky.app/img/avatar/plain/did:plc:xyz/avatar.jpg' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const value = await blueskyHandler.resolve('https://bsky.app/profile/user.bsky.social')

      expect(value).toEqual([])
    })

    it('should return empty array when avatar is empty string', async () => {
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
          JSON.stringify({ avatar: '' }),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when avatar is not a string', async () => {
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
          JSON.stringify({ avatar: 123 }),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns no avatar', async () => {
      const mockFetch = createMockFetch({
        'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social':
          JSON.stringify({}),
      })
      const value = await blueskyHandler.resolve(
        'https://bsky.app/profile/user.bsky.social',
        undefined,
        undefined,
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
        undefined,
        undefined,
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
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      const mockFetch = createMockFetch({})
      const value = await blueskyHandler.resolve('not-a-url', undefined, undefined, mockFetch)

      expect(value).toEqual([])
    })
  })
})
