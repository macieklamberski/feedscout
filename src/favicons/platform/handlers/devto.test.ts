import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { devtoHandler } from './devto.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

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
    it('should return profile image from dev.to API', async () => {
      const mockFetch = createMockFetch({
        'https://dev.to/api/users/by_username?url=alice': JSON.stringify({
          profile_image: 'https://res.cloudinary.com/practicaldev/image/fetch/alice.jpg',
        }),
      })
      const value = await devtoHandler.resolve(
        'https://dev.to/alice',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://res.cloudinary.com/practicaldev/image/fetch/alice.jpg' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array when profile_image is absent', async () => {
      const mockFetch = createMockFetch({
        'https://dev.to/api/users/by_username?url=alice': JSON.stringify({}),
      })
      const value = await devtoHandler.resolve(
        'https://dev.to/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when profile_image is empty string', async () => {
      const mockFetch = createMockFetch({
        'https://dev.to/api/users/by_username?url=alice': JSON.stringify({ profile_image: '' }),
      })
      const value = await devtoHandler.resolve(
        'https://dev.to/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array for tag pages', async () => {
      const mockFetch = createMockFetch({})
      const value = await devtoHandler.resolve(
        'https://dev.to/t/javascript',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns invalid JSON', async () => {
      const mockFetch = createMockFetch({
        'https://dev.to/api/users/by_username?url=alice': 'not-json',
      })
      const value = await devtoHandler.resolve(
        'https://dev.to/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const value = await devtoHandler.resolve('https://dev.to/alice')

      expect(value).toEqual([])
    })

    it('should return empty array when fetch throws', async () => {
      const mockFetch: DiscoverFetchFn = () => {
        throw new Error('Network error')
      }
      const value = await devtoHandler.resolve(
        'https://dev.to/alice',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      const mockFetch = createMockFetch({})
      const value = await devtoHandler.resolve('not-a-url', undefined, undefined, mockFetch)

      expect(value).toEqual([])
    })
  })
})
