import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { peertubeHandler } from './peertube.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const peertubeHeaders = new Headers({ 'x-powered-by': 'PeerTube' })

const channelAvatars = JSON.stringify({
  name: 'news',
  avatars: [
    { width: 48, height: 48, path: '/lazy-static/avatars/48.png' },
    { width: 120, height: 120, path: '/lazy-static/avatars/120.png' },
    { width: 600, height: 600, path: '/lazy-static/avatars/600.png' },
    { width: 1500, height: 1500, path: '/lazy-static/avatars/1500.png' },
  ],
})

describe('peertubeHandler', () => {
  describe('match', () => {
    it('should match channel page with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/c/news', '', peertubeHeaders)).toBe(true)
    })

    it('should match account page with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/a/alice', '', peertubeHeaders)).toBe(true)
    })

    it('should match account subpage with PeerTube header', () => {
      const value = 'https://example.com/a/alice/video-channels'

      expect(peertubeHandler.match(value, '', peertubeHeaders)).toBe(true)
    })

    it('should not match instance home with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/', '', peertubeHeaders)).toBe(false)
    })

    it('should not match video page with PeerTube header', () => {
      expect(peertubeHandler.match('https://example.com/w/abc123', '', peertubeHeaders)).toBe(false)
    })

    it('should not match channel page without PeerTube header', () => {
      const headers = new Headers({ 'x-powered-by': 'Express' })

      expect(peertubeHandler.match('https://example.com/c/news', '', headers)).toBe(false)
    })

    it('should not match without headers', () => {
      expect(peertubeHandler.match('https://example.com/c/news')).toBe(false)
    })

    it('should not match invalid URL', () => {
      expect(peertubeHandler.match('not-a-url', '', peertubeHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve channel avatar from og:image', async () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/abc.png"
          />
        `
        const result = await peertubeHandler.resolve('https://example.com/c/news', value)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/abc.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve account avatar from og:image', async () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/def.jpg"
          />
        `
        const result = await peertubeHandler.resolve('https://example.com/a/alice', value)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/def.jpg' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve channel avatar from API without page content', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news': channelAvatars,
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/1500.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should resolve account avatar from API without page content', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/accounts/alice': channelAvatars,
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/a/alice',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/1500.png' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for instance home', async () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/instance.png"
          />
        `
        const result = await peertubeHandler.resolve('https://example.com/', value)

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        const result = await peertubeHandler.resolve('not-a-url')

        expect(result).toEqual([])
      })

      it('should return empty array without og:image and fetchFn', async () => {
        const result = await peertubeHandler.resolve('https://example.com/c/news', '<html></html>')

        expect(result).toEqual([])
      })

      it('should return empty array when API has no avatars', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news': JSON.stringify({ avatars: [] }),
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when API response lacks avatars field', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news': JSON.stringify({ name: 'news' }),
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news': 'not json',
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
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
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should fall back to API when og:image is outside the avatars path', async () => {
        const value = '<meta property="og:image" content="https://example.com/client/og.png" />'
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news': channelAvatars,
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
          value,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/1500.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should pick 600 width avatar when 1500 is missing', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news': JSON.stringify({
            avatars: [
              { width: 120, path: '/lazy-static/avatars/120.png' },
              { width: 600, path: '/lazy-static/avatars/600.png' },
            ],
          }),
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/600.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return empty array when only small avatars exist', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news': JSON.stringify({
            avatars: [{ width: 48, path: '/lazy-static/avatars/48.png' }],
          }),
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should resolve remote channel through the local instance API', async () => {
        const mockFetch = createMockFetch({
          'https://example.com/api/v1/video-channels/news@example.org': channelAvatars,
        })
        const result = await peertubeHandler.resolve(
          'https://example.com/c/news@example.org',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://example.com/lazy-static/avatars/1500.png' },
        ]

        expect(result).toEqual(expected)
      })
    })
  })
})
