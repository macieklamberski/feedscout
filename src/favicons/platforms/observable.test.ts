import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { observableEnricher, observableHandler } from './observable.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const apiUrl = 'https://api.observablehq.com/user/@alice'

const ref: DiscoverRef = {
  platform: 'observable',
  id: 'alice',
  url: 'https://observablehq.com/@alice',
}

describe('observableHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(observableHandler.match('https://observablehq.com/@alice')).toBe(true)
    })

    it('should not match recent URL', () => {
      expect(observableHandler.match('https://observablehq.com/recent')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a profile page', async () => {
      const expected: Array<DiscoverRef> = [ref]

      expect(await observableHandler.resolve('https://observablehq.com/@alice')).toEqual(expected)
    })

    it('should return the owner ref for a collection page', async () => {
      const url = 'https://observablehq.com/@alice/-/collection/maps'
      const expected: Array<DiscoverRef> = [{ platform: 'observable', id: 'alice', url }]

      expect(await observableHandler.resolve(url)).toEqual(expected)
    })

    it('should return the owner ref for a notebook page', async () => {
      const url = 'https://observablehq.com/@alice/hello-world'
      const expected: Array<DiscoverRef> = [{ platform: 'observable', id: 'alice', url }]

      expect(await observableHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for a non-profile page', async () => {
      expect(await observableHandler.resolve('https://observablehq.com/recent')).toEqual([])
    })
  })
})

describe('observableEnricher', () => {
  it('should return the avatar from the user API', async () => {
    const context = createContext({
      [apiUrl]: JSON.stringify({
        id: '074c414ad1d825f5',
        avatar_url: 'https://avatars.observableusercontent.com/avatar/7dbba99ced40bd5ab8013c99',
        login: 'alice',
        name: 'Alice',
        type: 'individual',
      }),
    })
    const expected = ['https://avatars.observableusercontent.com/avatar/7dbba99ced40bd5ab8013c99']

    expect(await observableEnricher(ref, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const value: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await observableEnricher(value, createContext({}))).toBeUndefined()
  })

  it('should return empty array for an unknown user', async () => {
    const context = createContext({ [apiUrl]: JSON.stringify({ errors: [] }) })

    expect(await observableEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when avatar_url is null', async () => {
    const context = createContext({
      [apiUrl]: JSON.stringify({ login: 'alice', avatar_url: null }),
    })

    expect(await observableEnricher(ref, context)).toEqual([])
  })

  it('should reject when API returns invalid JSON', () => {
    const context = createContext({ [apiUrl]: 'not-json' })
    const throwing = () => observableEnricher(ref, context)

    expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => observableEnricher(ref, { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', () => {
    const throwing = () => observableEnricher(ref, createContext({}))
    const expected = 'Unexpected status 404 from https://api.observablehq.com/user/@alice'

    expect(throwing()).rejects.toThrow(expected)
  })
})
