import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { arenaHandler } from './arena.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const profileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://static.avatars.are.na/15/large_f91bdac52d14ef988c9818884d6865db.jpg?1616377630"
        data-next-head=""
      />
      <meta
        property="og:image:width"
        content="1200"
        data-next-head=""
      />
    </head>
  </html>
`

const placeholderProfileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://www.are.na/og-image.png"
        data-next-head=""
      />
    </head>
  </html>
`

const channelApiUrl = 'https://api.are.na/v2/channels/good-sign-offs?per=1'

const channelJson = JSON.stringify({
  id: 207511,
  slug: 'good-sign-offs',
  user: {
    slug: 'meg-miller',
    avatar_image: {
      thumb:
        'https://static.avatars.are.na/4094/small_f3db7f44de1bb70e00b733c71b6ac80e.jpg?1496713662',
      display:
        'https://static.avatars.are.na/4094/medium_f3db7f44de1bb70e00b733c71b6ac80e.jpg?1496713662',
    },
  },
})

describe('arenaHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(arenaHandler.match('https://www.are.na/charles-broskoski')).toBe(true)
    })

    it('should match channel URLs', () => {
      expect(arenaHandler.match('https://www.are.na/meg-miller/good-sign-offs')).toBe(true)
    })

    it('should match URLs without www', () => {
      expect(arenaHandler.match('https://are.na/charles-broskoski')).toBe(true)
    })

    it('should not match the root URL', () => {
      expect(arenaHandler.match('https://www.are.na')).toBe(false)
      expect(arenaHandler.match('https://www.are.na/')).toBe(false)
    })

    it('should not match editorial pages', () => {
      expect(arenaHandler.match('https://www.are.na/editorial')).toBe(false)
      expect(arenaHandler.match('https://www.are.na/editorial/some-article')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(arenaHandler.match('https://www.are.na/explore')).toBe(false)
      expect(arenaHandler.match('https://www.are.na/settings')).toBe(false)
    })

    it('should not match paths deeper than a channel', () => {
      expect(arenaHandler.match('https://www.are.na/meg-miller/good-sign-offs/feed/rss')).toBe(
        false,
      )
    })

    it('should not match non-Are.na URLs', () => {
      expect(arenaHandler.match('https://example.com/charles-broskoski')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(arenaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('profile pages', () => {
      it('should return the og:image avatar', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          profileHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://static.avatars.are.na/15/large_f91bdac52d14ef988c9818884d6865db.jpg?1616377630',
          },
        ]

        expect(result).toEqual(expected)
      })

      it('should return empty array for the placeholder og:image', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          placeholderProfileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when og:image is missing', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          '<html><head></head></html>',
        )

        expect(result).toEqual([])
      })

      it('should return empty array without content', async () => {
        const result = await arenaHandler.resolve('https://www.are.na/charles-broskoski')

        expect(result).toEqual([])
      })
    })

    describe('channel pages', () => {
      it('should return the owner avatar in the large size', async () => {
        const mockFetch = createMockFetch({ [channelApiUrl]: channelJson })
        const result = await arenaHandler.resolve(
          'https://www.are.na/meg-miller/good-sign-offs',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://static.avatars.are.na/4094/large_f3db7f44de1bb70e00b733c71b6ac80e.jpg?1496713662',
          },
        ]

        expect(result).toEqual(expected)
      })

      it('should return empty array when the channel belongs to another user', async () => {
        const mockFetch = createMockFetch({ [channelApiUrl]: channelJson })
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski/good-sign-offs',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the owner has no avatar', async () => {
        const json = JSON.stringify({
          user: {
            slug: 'meg-miller',
            avatar_image: {
              thumb: '',
              display: '',
            },
          },
        })
        const mockFetch = createMockFetch({ [channelApiUrl]: json })
        const result = await arenaHandler.resolve(
          'https://www.are.na/meg-miller/good-sign-offs',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when avatar_image is missing', async () => {
        const json = JSON.stringify({ user: { slug: 'meg-miller' } })
        const mockFetch = createMockFetch({ [channelApiUrl]: json })
        const result = await arenaHandler.resolve(
          'https://www.are.na/meg-miller/good-sign-offs',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({ [channelApiUrl]: 'not-json' })
        const result = await arenaHandler.resolve(
          'https://www.are.na/meg-miller/good-sign-offs',
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
        const result = await arenaHandler.resolve(
          'https://www.are.na/meg-miller/good-sign-offs',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided', async () => {
        const result = await arenaHandler.resolve('https://www.are.na/meg-miller/good-sign-offs')

        expect(result).toEqual([])
      })
    })

    it('should return empty array for editorial pages', async () => {
      const mockFetch = createMockFetch({})
      const result = await arenaHandler.resolve(
        'https://www.are.na/editorial',
        profileHtml,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })
  })
})
