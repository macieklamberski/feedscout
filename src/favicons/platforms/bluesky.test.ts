import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { blueskyEnricher, blueskyHandler, isProfilePath } from './bluesky.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const userRef: DiscoverRef = {
  platform: 'bluesky',
  id: 'user.bsky.social',
  url: 'https://bsky.app/profile/user.bsky.social',
}

const userApiUrl =
  'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social'

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
    it('should return a ref for the profile handle', async () => {
      const expected: Array<DiscoverRef> = [userRef]

      expect(await blueskyHandler.resolve('https://bsky.app/profile/user.bsky.social')).toEqual(
        expected,
      )
    })

    it('should return a ref for a custom domain handle', async () => {
      const url = 'https://bsky.app/profile/example.com'
      const expected: Array<DiscoverRef> = [{ platform: 'bluesky', id: 'example.com', url }]

      expect(await blueskyHandler.resolve(url)).toEqual(expected)
    })

    it('should return a ref for the www.bsky.app variant', async () => {
      const url = 'https://www.bsky.app/profile/user.bsky.social'
      const expected: Array<DiscoverRef> = [{ platform: 'bluesky', id: 'user.bsky.social', url }]

      expect(await blueskyHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for non-profile path', async () => {
      expect(await blueskyHandler.resolve('https://bsky.app/about')).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      expect(await blueskyHandler.resolve('not-a-url')).toEqual([])
    })
  })
})

describe('blueskyEnricher', () => {
  it('should resolve avatar from Bluesky API', async () => {
    const context = createContext({
      [userApiUrl]: JSON.stringify({
        avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:abc123/avatar.jpg',
      }),
    })
    const expected = ['https://cdn.bsky.app/img/avatar/plain/did:plc:abc123/avatar.jpg']

    expect(await blueskyEnricher(userRef, context)).toEqual(expected)
  })

  it('should resolve avatar for custom domain handle', async () => {
    const context = createContext({
      'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=example.com':
        JSON.stringify({
          avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:xyz/avatar.jpg',
        }),
    })
    const ref: DiscoverRef = {
      platform: 'bluesky',
      id: 'example.com',
      url: 'https://bsky.app/profile/example.com',
    }
    const expected = ['https://cdn.bsky.app/img/avatar/plain/did:plc:xyz/avatar.jpg']

    expect(await blueskyEnricher(ref, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = { platform: 'mastodon', id: 'user', url: 'https://example.com/@user' }

    expect(await blueskyEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when avatar is empty string', async () => {
    const context = createContext({ [userApiUrl]: JSON.stringify({ avatar: '' }) })

    expect(await blueskyEnricher(userRef, context)).toEqual([])
  })

  it('should return empty array when avatar is not a string', async () => {
    const context = createContext({ [userApiUrl]: JSON.stringify({ avatar: 123 }) })

    expect(await blueskyEnricher(userRef, context)).toEqual([])
  })

  it('should return empty array when API returns no avatar', async () => {
    const context = createContext({ [userApiUrl]: JSON.stringify({}) })

    expect(await blueskyEnricher(userRef, context)).toEqual([])
  })

  it('should return empty array when API returns invalid JSON', async () => {
    const context = createContext({ [userApiUrl]: 'not json' })

    expect(await blueskyEnricher(userRef, context)).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await blueskyEnricher(userRef, { fetchFn })).toEqual([])
  })
})
