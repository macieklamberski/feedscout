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

    it('should match profile URLs with trailing slash', () => {
      expect(observableHandler.match('https://observablehq.com/@alice/')).toBe(true)
    })

    it('should match www profile URLs', () => {
      expect(observableHandler.match('https://www.observablehq.com/@alice')).toBe(true)
    })

    it('should match collection URLs', () => {
      expect(observableHandler.match('https://observablehq.com/@alice/-/collection/maps')).toBe(
        true,
      )
    })

    it('should match collection URLs without the dash segment', () => {
      expect(observableHandler.match('https://observablehq.com/@alice/collection/maps')).toBe(true)
    })

    it('should not match notebook URLs', () => {
      expect(observableHandler.match('https://observablehq.com/@alice/hello-world')).toBe(false)
    })

    it('should not match recent URL', () => {
      expect(observableHandler.match('https://observablehq.com/recent')).toBe(false)
    })

    it('should not match trending URL', () => {
      expect(observableHandler.match('https://observablehq.com/trending')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(observableHandler.match('https://observablehq.com/')).toBe(false)
    })

    it('should not match non-Observable URLs', () => {
      expect(observableHandler.match('https://example.com/@alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(observableHandler.match('not-a-url')).toBe(false)
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

    it('should return empty array for a notebook page', async () => {
      const url = 'https://observablehq.com/@alice/hello-world'

      expect(await observableHandler.resolve(url)).toEqual([])
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

  it('should reject when API returns invalid JSON', async () => {
    const context = createContext({ [apiUrl]: 'not-json' })

    await expect(observableEnricher(ref, context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(observableEnricher(ref, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    await expect(observableEnricher(ref, createContext({}))).rejects.toThrow()
  })
})
