import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { devtoEnricher, devtoHandler } from './devto.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const aliceRef: DiscoverRef = { platform: 'devto', id: 'alice', url: 'https://dev.to/alice' }

describe('devtoHandler', () => {
  describe('match', () => {
    it('should match dev.to user profile URLs', () => {
      expect(devtoHandler.match('https://dev.to/alice')).toBe(true)
      expect(devtoHandler.match('https://dev.to/thepracticaldev')).toBe(true)
    })

    it('should match www.dev.to user profile URLs', () => {
      expect(devtoHandler.match('https://www.dev.to/alice')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(devtoHandler.match('https://dev.to/t/javascript')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(devtoHandler.match('https://dev.to/search')).toBe(false)
      expect(devtoHandler.match('https://dev.to/settings')).toBe(false)
      expect(devtoHandler.match('https://dev.to/dashboard')).toBe(false)
    })

    it('should not match dev.to root URL', () => {
      expect(devtoHandler.match('https://dev.to')).toBe(false)
      expect(devtoHandler.match('https://dev.to/')).toBe(false)
    })

    it('should not match non-dev.to URLs', () => {
      expect(devtoHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(devtoHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a user profile', async () => {
      expect(await devtoHandler.resolve('https://dev.to/alice')).toEqual([aliceRef])
    })

    it('should return a ref for a www.dev.to URL', async () => {
      const url = 'https://www.dev.to/alice'
      const expected: Array<DiscoverRef> = [{ platform: 'devto', id: 'alice', url }]

      expect(await devtoHandler.resolve(url)).toEqual(expected)
    })

    it('should return a ref for excluded paths, since only match guards them', async () => {
      const url = 'https://dev.to/search'
      const expected: Array<DiscoverRef> = [{ platform: 'devto', id: 'search', url }]

      expect(await devtoHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for tag pages', async () => {
      expect(await devtoHandler.resolve('https://dev.to/t/javascript')).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      expect(await devtoHandler.resolve('not-a-url')).toEqual([])
    })
  })
})

describe('devtoEnricher', () => {
  it('should return profile image from dev.to API', async () => {
    const context = createContext({
      'https://dev.to/api/users/by_username?url=alice': JSON.stringify({
        profile_image: 'https://res.cloudinary.com/practicaldev/image/fetch/alice.jpg',
      }),
    })

    expect(await devtoEnricher(aliceRef, context)).toEqual([
      'https://res.cloudinary.com/practicaldev/image/fetch/alice.jpg',
    ])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = { platform: 'mastodon', id: 'user', url: 'https://example.com/@user' }

    expect(await devtoEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when profile_image is absent', async () => {
    const context = createContext({
      'https://dev.to/api/users/by_username?url=alice': JSON.stringify({}),
    })

    expect(await devtoEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when profile_image is empty string', async () => {
    const context = createContext({
      'https://dev.to/api/users/by_username?url=alice': JSON.stringify({ profile_image: '' }),
    })

    expect(await devtoEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when API returns invalid JSON', async () => {
    const context = createContext({
      'https://dev.to/api/users/by_username?url=alice': 'not-json',
    })

    expect(await devtoEnricher(aliceRef, context)).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await devtoEnricher(aliceRef, { fetchFn })).toEqual([])
  })
})
