import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { velogHandler } from './velog.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const apiUrl =
  'https://v2.velog.io/graphql?query=%7Buser%28username%3A%22alice%22%29%7Bprofile%7Bthumbnail%7D%7D%7D'

const profileHtml = `
  <div class="UserProfile_left__NbH_X">
    <img
      alt="profile"
      fetchPriority="high"
      width="128"
      height="128"
      src="https://images.velog.io/images/alice/profile/0f3c/avatar.png"
    />
  </div>
`

const postHtml = `
  <img
    src="https://velog.velcdn.com/images/alice/profile/0f3c/avatar.png"
    alt="profile"
  />
`

const placeholderHtml = `
  <img
    alt="profile"
    src="https://velcdn.com/images/user-thumbnail.png"
  />
`

describe('velogHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(velogHandler.match('https://velog.io/@alice')).toBe(true)
    })

    it('should match profile subpages', () => {
      expect(velogHandler.match('https://velog.io/@alice/posts')).toBe(true)
      expect(velogHandler.match('https://velog.io/@alice/series')).toBe(true)
      expect(velogHandler.match('https://velog.io/@alice/about')).toBe(true)
    })

    it('should match post URLs', () => {
      expect(velogHandler.match('https://velog.io/@alice/hello-world')).toBe(true)
    })

    it('should match www.velog.io profile URLs', () => {
      expect(velogHandler.match('https://www.velog.io/@alice')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(velogHandler.match('https://velog.io/')).toBe(false)
    })

    it('should not match non-profile paths', () => {
      expect(velogHandler.match('https://velog.io/recent')).toBe(false)
      expect(velogHandler.match('https://velog.io/tags/react')).toBe(false)
    })

    it('should not match non-velog URLs', () => {
      expect(velogHandler.match('https://example.com/@alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(velogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return profile image from profile page HTML', async () => {
        const result = await velogHandler.resolve('https://velog.io/@alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.velog.io/images/alice/profile/0f3c/avatar.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return author image from post page HTML', async () => {
        const result = await velogHandler.resolve('https://velog.io/@alice/hello-world', postHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://velog.velcdn.com/images/alice/profile/0f3c/avatar.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return thumbnail from GraphQL API when content is absent', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({
            data: {
              user: {
                profile: {
                  thumbnail: 'https://images.velog.io/images/alice/profile/0f3c/avatar.png',
                },
              },
            },
          }),
        })
        const result = await velogHandler.resolve(
          'https://velog.io/@alice/series',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.velog.io/images/alice/profile/0f3c/avatar.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return thumbnail from GraphQL API when HTML has no profile image', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({
            data: {
              user: {
                profile: {
                  thumbnail: 'https://images.velog.io/images/alice/profile/0f3c/avatar.png',
                },
              },
            },
          }),
        })
        const result = await velogHandler.resolve(
          'https://velog.io/@alice',
          '<html><body></body></html>',
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.velog.io/images/alice/profile/0f3c/avatar.png' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the home page', async () => {
        const mockFetch = createMockFetch({})
        const result = await velogHandler.resolve(
          'https://velog.io/',
          profileHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided and HTML has no image', async () => {
        const result = await velogHandler.resolve('https://velog.io/@alice')

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await velogHandler.resolve(
          'https://velog.io/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({ [apiUrl]: 'not-json' })
        const result = await velogHandler.resolve(
          'https://velog.io/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when user does not exist', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({ data: { user: null } }),
        })
        const result = await velogHandler.resolve(
          'https://velog.io/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when thumbnail is null', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({ data: { user: { profile: { thumbnail: null } } } }),
        })
        const result = await velogHandler.resolve(
          'https://velog.io/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const result = await velogHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should skip placeholder image in HTML', async () => {
        const result = await velogHandler.resolve('https://velog.io/@alice', placeholderHtml)

        expect(result).toEqual([])
      })

      it('should skip placeholder thumbnail from GraphQL API', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({
            data: {
              user: { profile: { thumbnail: 'https://velcdn.com/images/user-thumbnail.png' } },
            },
          }),
        })
        const result = await velogHandler.resolve(
          'https://velog.io/@alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should not fetch when HTML has profile image', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Unexpected fetch')
        }
        const result = await velogHandler.resolve(
          'https://velog.io/@alice',
          profileHtml,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.velog.io/images/alice/profile/0f3c/avatar.png' },
        ]

        expect(result).toEqual(expected)
      })
    })
  })
})
