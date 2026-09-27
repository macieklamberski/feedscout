import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { blueskyEnricher, blueskyHandler } from './bluesky.js'

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

describe('blueskyHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(blueskyHandler.match('https://bsky.app/profile/user.bsky.social')).toBe(true)
    })

    it('should not match non-profile paths', () => {
      expect(blueskyHandler.match('https://bsky.app/about')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for the profile handle', async () => {
      const expected = [userRef]

      expect(await blueskyHandler.resolve('https://bsky.app/profile/user.bsky.social')).toEqual(
        expected,
      )
    })

    it('should return empty array for a page without a profile', async () => {
      expect(await blueskyHandler.resolve('https://bsky.app/about')).toEqual([])
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

  it('should reject when API returns invalid JSON', async () => {
    const context = createContext({ [userApiUrl]: 'not json' })
    const throwing = () => blueskyEnricher(userRef, context)

    await expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => blueskyEnricher(userRef, { fetchFn })

    await expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', async () => {
    const throwing = () => blueskyEnricher(userRef, createContext({}))
    const expected =
      'Unexpected status 404 from https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=user.bsky.social'

    await expect(throwing()).rejects.toThrow(expected)
  })
})
