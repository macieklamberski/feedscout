import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { observableHandler } from './observable.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const userApiUrl = 'https://api.observablehq.com/user/@alice'
const userJson = JSON.stringify({
  id: '074c414ad1d825f5',
  avatar_url: 'https://avatars.observableusercontent.com/avatar/7dbba99ced40bd5ab8013c99',
  login: 'alice',
  name: 'Alice',
  type: 'individual',
})

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
    describe('happy paths', () => {
      it('should return avatar for profile page', async () => {
        const mockFetch = createMockFetch({ [userApiUrl]: userJson })
        const result = await observableHandler.resolve(
          'https://observablehq.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://avatars.observableusercontent.com/avatar/7dbba99ced40bd5ab8013c99' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return owner avatar for collection page', async () => {
        const mockFetch = createMockFetch({ [userApiUrl]: userJson })
        const result = await observableHandler.resolve(
          'https://observablehq.com/@alice/-/collection/maps',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://avatars.observableusercontent.com/avatar/7dbba99ced40bd5ab8013c99' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for recent page', async () => {
        const mockFetch = createMockFetch({})
        const result = await observableHandler.resolve(
          'https://observablehq.com/recent',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for trending page', async () => {
        const mockFetch = createMockFetch({})
        const result = await observableHandler.resolve(
          'https://observablehq.com/trending',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for unknown user', async () => {
        const mockFetch = createMockFetch({ [userApiUrl]: JSON.stringify({ errors: [] }) })
        const result = await observableHandler.resolve(
          'https://observablehq.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when avatar_url is null', async () => {
        const mockFetch = createMockFetch({
          [userApiUrl]: JSON.stringify({ login: 'alice', avatar_url: null }),
        })
        const result = await observableHandler.resolve(
          'https://observablehq.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({ [userApiUrl]: 'not-json' })
        const result = await observableHandler.resolve(
          'https://observablehq.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await observableHandler.resolve(
          'https://observablehq.com/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided', async () => {
        const result = await observableHandler.resolve('https://observablehq.com/@alice')

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const mockFetch = createMockFetch({})
        const result = await observableHandler.resolve('not-a-url', undefined, undefined, mockFetch)

        expect(result).toEqual([])
      })
    })
  })
})
