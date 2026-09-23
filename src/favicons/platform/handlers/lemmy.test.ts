import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { lemmyHandler } from './lemmy.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const communityHtml = `
  <html>
    <head>
      <meta
        data-inferno-helmet="true"
        property="og:image"
        content="https://lemmy.example.com/pictrs/image/community.png"
      >
    </head>
    <body class="lemmy-site"></body>
  </html>
`
const communityHtmlWithoutIcon = '<html><body class="lemmy-site"></body></html>'
const apiUrl = 'https://lemmy.example.com/api/v3/community?name=technology'

describe('lemmyHandler', () => {
  describe('match', () => {
    it('should match community path with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.example.com/c/technology', communityHtml)).toBe(true)
    })

    it('should match community path with Lemmy powered-by header', () => {
      const value = new Headers({ 'x-powered-by': 'Lemmy' })

      expect(lemmyHandler.match('https://lemmy.example.com/c/technology', '', value)).toBe(true)
    })

    it('should not match community path without Lemmy signals', () => {
      expect(lemmyHandler.match('https://example.com/c/technology', '<html></html>')).toBe(false)
    })

    it('should not match user path', () => {
      expect(lemmyHandler.match('https://lemmy.example.com/u/alice', communityHtml)).toBe(false)
    })

    it('should not match home path', () => {
      expect(lemmyHandler.match('https://lemmy.example.com/', communityHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(lemmyHandler.match('not-a-url', communityHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve community icon from og:image', async () => {
        const value = 'https://lemmy.example.com/c/technology'
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://lemmy.example.com/pictrs/image/community.png' },
        ]

        expect(await lemmyHandler.resolve(value, communityHtml)).toEqual(expected)
      })

      it('should resolve community icon from API when page has no content', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({
            community_view: {
              community: {
                name: 'technology',
                icon: 'https://lemmy.example.com/pictrs/image/community.png',
              },
            },
          }),
        })
        const result = await lemmyHandler.resolve(
          'https://lemmy.example.com/c/technology',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://lemmy.example.com/pictrs/image/community.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve federated community icon from API', async () => {
        const mockFetch = createMockFetch({
          'https://lemmy.example.com/api/v3/community?name=rust%40lemmy.example.org':
            JSON.stringify({
              community_view: {
                community: { icon: 'https://lemmy.example.org/pictrs/image/rust.png' },
              },
            }),
        })
        const result = await lemmyHandler.resolve(
          'https://lemmy.example.com/c/rust@lemmy.example.org',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://lemmy.example.org/pictrs/image/rust.png' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array when community has no icon', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({ community_view: { community: { name: 'technology' } } }),
        })
        const result = await lemmyHandler.resolve(
          'https://lemmy.example.com/c/technology',
          communityHtmlWithoutIcon,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for user path', async () => {
        const mockFetch = createMockFetch({})
        const result = await lemmyHandler.resolve(
          'https://lemmy.example.com/u/alice',
          communityHtml,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided', async () => {
        const value = 'https://lemmy.example.com/c/technology'

        expect(await lemmyHandler.resolve(value, communityHtmlWithoutIcon)).toEqual([])
      })

      it('should return empty array when API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({ [apiUrl]: 'not json' })
        const result = await lemmyHandler.resolve(
          'https://lemmy.example.com/c/technology',
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
        const result = await lemmyHandler.resolve(
          'https://lemmy.example.com/c/technology',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const mockFetch = createMockFetch({})

        expect(await lemmyHandler.resolve('not-a-url', undefined, undefined, mockFetch)).toEqual([])
      })
    })
  })
})
