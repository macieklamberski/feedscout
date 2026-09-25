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
    it('should return true for a user profile', () => {
      expect(devtoHandler.match('https://dev.to/alice')).toBe(true)
    })

    it('should return false for a tag page', () => {
      expect(devtoHandler.match('https://dev.to/t/javascript')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a user profile', async () => {
      expect(await devtoHandler.resolve('https://dev.to/alice')).toEqual([aliceRef])
    })

    it('should return empty array for a tag page', async () => {
      expect(await devtoHandler.resolve('https://dev.to/t/javascript')).toEqual([])
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

  it('should reject when API returns invalid JSON', () => {
    const context = createContext({
      'https://dev.to/api/users/by_username?url=alice': 'not-json',
    })
    const throwing = () => devtoEnricher(aliceRef, context)

    expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => devtoEnricher(aliceRef, { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should return the organization image when the users API does not know the name', async () => {
    const ref: DiscoverRef = { platform: 'devto', id: 'gde', url: 'https://dev.to/gde' }
    const context = createContext({
      'https://dev.to/api/organizations/gde': JSON.stringify({
        profile_image: 'https://media2.dev.to/uploads/organization/profile_image/11939/gde.png',
      }),
    })

    expect(await devtoEnricher(ref, context)).toEqual([
      'https://media2.dev.to/uploads/organization/profile_image/11939/gde.png',
    ])
  })

  it('should reject when neither API knows the name', () => {
    const throwing = () => devtoEnricher(aliceRef, createContext({}))
    const expected = 'Unexpected status 404 from https://dev.to/api/organizations/alice'

    expect(throwing()).rejects.toThrow(expected)
  })

  it('should reject without trying the organizations API when the users API fails', () => {
    const requestedUrls: Array<string> = []
    const fetchFn: FetchFn = (url) => {
      requestedUrls.push(url)

      return { headers: new Headers(), body: '', url, status: 500 }
    }
    const throwing = () => devtoEnricher(aliceRef, { fetchFn })
    const expected = 'Unexpected status 500 from https://dev.to/api/users/by_username?url=alice'

    expect(throwing()).rejects.toThrow(expected)
    expect(requestedUrls).toEqual(['https://dev.to/api/users/by_username?url=alice'])
  })
})
