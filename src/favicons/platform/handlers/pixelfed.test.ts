import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { pixelfedHandler } from './pixelfed.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const lookupUrl = 'https://example.com/api/v1/accounts/lookup?acct=alice'
const pixelfedHtml = '<html><head><meta name="generator" content="pixelfed"></head></html>'
const profileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57"
      >
      <meta property="og:image:width" content="200">
      <meta name="application-name" content="Pixelfed">
      <meta name="generator" content="pixelfed">
    </head>
  </html>
`

describe('pixelfedHandler', () => {
  describe('match', () => {
    it('should match /{user} with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://example.com/alice', pixelfedHtml)).toBe(true)
    })

    it('should match /users/{user} with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://example.com/users/alice', pixelfedHtml)).toBe(true)
    })

    it('should not match profile path without Pixelfed content', () => {
      const value = '<meta name="generator" content="WordPress 6.0">'

      expect(pixelfedHandler.match('https://example.com/alice', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(pixelfedHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(pixelfedHandler.match('https://example.com/discover', pixelfedHtml)).toBe(false)
      expect(pixelfedHandler.match('https://example.com/settings', pixelfedHtml)).toBe(false)
    })

    it('should not match post paths', () => {
      expect(pixelfedHandler.match('https://example.com/p/alice/123', pixelfedHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(pixelfedHandler.match('not-a-url', pixelfedHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve avatar from og:image on /{user}', async () => {
        const result = await pixelfedHandler.resolve('https://example.com/alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve avatar from og:image on /users/{user}', async () => {
        const result = await pixelfedHandler.resolve('https://example.com/users/alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/storage/avatars/000/000/000/002/abc_avatar.jpg?v=57' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve avatar from API when page has no og:image', async () => {
        const mockFetch = createMockFetch({
          [lookupUrl]: JSON.stringify({
            username: 'alice',
            avatar: 'https://example.com/storage/avatars/561598194146945883/krwzqr.jpg?v=1',
          }),
        })
        const result = await pixelfedHandler.resolve(
          'https://example.com/alice',
          pixelfedHtml,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/storage/avatars/561598194146945883/krwzqr.jpg?v=1' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve avatar from API when content is missing', async () => {
        const mockFetch = createMockFetch({
          [lookupUrl]: JSON.stringify({
            avatar: 'https://cdn.example.com/cache/avatars/550096353336233985/avatar_lyn3g6.png',
          }),
        })
        const result = await pixelfedHandler.resolve(
          'https://example.com/users/alice',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://cdn.example.com/cache/avatars/550096353336233985/avatar_lyn3g6.png' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for excluded path', async () => {
        const result = await pixelfedHandler.resolve('https://example.com/discover', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const result = await pixelfedHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array when page has no og:image and fetchFn is missing', async () => {
        const result = await pixelfedHandler.resolve('https://example.com/alice', pixelfedHtml)

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await pixelfedHandler.resolve(
          'https://example.com/alice',
          pixelfedHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({ [lookupUrl]: '<html>Not Found</html>' })
        const result = await pixelfedHandler.resolve(
          'https://example.com/alice',
          pixelfedHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when API returns no avatar', async () => {
        const mockFetch = createMockFetch({ [lookupUrl]: JSON.stringify({ username: 'alice' }) })
        const result = await pixelfedHandler.resolve(
          'https://example.com/alice',
          pixelfedHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should return empty array for default avatar in og:image', async () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/storage/avatars/default.jpg"
          >
        `
        const result = await pixelfedHandler.resolve('https://example.com/alice', value)

        expect(result).toEqual([])
      })

      it('should return empty array for default avatar from API', async () => {
        const mockFetch = createMockFetch({
          [lookupUrl]: JSON.stringify({
            avatar: 'https://example.com/storage/avatars/default.png?v=0',
          }),
        })
        const result = await pixelfedHandler.resolve(
          'https://example.com/alice',
          pixelfedHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })
  })
})
