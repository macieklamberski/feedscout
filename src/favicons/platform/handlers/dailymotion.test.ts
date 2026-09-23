import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { dailymotionHandler } from './dailymotion.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const userApiUrl = 'https://api.dailymotion.com/user/alice?fields=avatar_720_url'
const playlistApiUrl = 'https://api.dailymotion.com/playlist/x6abc1?fields=owner.avatar_720_url'

describe('dailymotionHandler', () => {
  describe('match', () => {
    it('should match user pages', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/alice')).toBe(true)
    })

    it('should match user pages without www', () => {
      expect(dailymotionHandler.match('https://dailymotion.com/alice')).toBe(true)
    })

    it('should match playlist pages', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/playlist/x6abc1')).toBe(true)
    })

    it('should not match channel pages', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/channel/news')).toBe(false)
    })

    it('should not match the home page', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/trending')).toBe(false)
      expect(dailymotionHandler.match('https://www.dailymotion.com/signin')).toBe(false)
    })

    it('should not match video pages', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/video/x8abc12')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(dailymotionHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(dailymotionHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the user avatar', async () => {
        const mockFetch = createMockFetch({
          [userApiUrl]: JSON.stringify({
            avatar_720_url: 'https://s2.dmcdn.net/u/QIeO1gi-tQgcpE5C/720x720',
          }),
        })
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/alice',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://s2.dmcdn.net/u/QIeO1gi-tQgcpE5C/720x720' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return the playlist owner avatar', async () => {
        const mockFetch = createMockFetch({
          [playlistApiUrl]: JSON.stringify({
            'owner.avatar_720_url': 'https://s2.dmcdn.net/u/F8t6-1gj2AjxjHsSZ/720x720',
          }),
        })
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/playlist/x6abc1',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://s2.dmcdn.net/u/F8t6-1gj2AjxjHsSZ/720x720' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the default avatar', async () => {
        const mockFetch = createMockFetch({
          [userApiUrl]: JSON.stringify({
            avatar_720_url: 'https://s1.dmcdn.net/d/5000002HraHpp/720x720',
          }),
        })
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the account is not found', async () => {
        const mockFetch = createMockFetch({
          [userApiUrl]: JSON.stringify({
            error: {
              code: 404,
              type: 'not_found',
            },
          }),
        })
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the avatar is empty', async () => {
        const mockFetch = createMockFetch({
          [userApiUrl]: JSON.stringify({ avatar_720_url: '' }),
        })
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({
          [userApiUrl]: 'not-json',
        })
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/alice',
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
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/alice',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetchFn is not provided', async () => {
        const result = await dailymotionHandler.resolve('https://www.dailymotion.com/alice')

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should return empty array for channel pages', async () => {
        const mockFetch = createMockFetch({})
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/channel/news',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array for the home page', async () => {
        const mockFetch = createMockFetch({})
        const result = await dailymotionHandler.resolve(
          'https://www.dailymotion.com/',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })
  })
})
