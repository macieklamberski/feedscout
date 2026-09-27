import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { peertubeEnricher, peertubeHandler } from './peertube.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (url: string, id: string): DiscoverRef => {
  return { platform: 'peertube', id, url }
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
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve channel avatar from og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/abc.png"
          />
        `
        const expected = [{ uri: 'https://example.com/lazy-static/avatars/abc.png' }]

        expect(peertubeHandler.resolve('https://example.com/c/news', value)).toEqual(expected)
      })

      it('should resolve account avatar from og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/lazy-static/avatars/def.jpg"
          />
        `
        const expected = [{ uri: 'https://example.com/lazy-static/avatars/def.jpg' }]

        expect(peertubeHandler.resolve('https://example.com/a/alice', value)).toEqual(expected)
      })

      it('should return a channel ref without content', () => {
        const url = 'https://example.com/c/news'
        const expected = [createRef(url, 'c/news')]

        expect(peertubeHandler.resolve(url)).toEqual(expected)
      })

      it('should return an account ref without content', () => {
        const url = 'https://example.com/a/alice'
        const expected = [createRef(url, 'a/alice')]

        expect(peertubeHandler.resolve(url)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a video page', () => {
        expect(peertubeHandler.resolve('https://example.com/w/abc123')).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should return a ref without og:image', () => {
        const url = 'https://example.com/c/news'
        const expected = [createRef(url, 'c/news')]

        expect(peertubeHandler.resolve(url, '<html></html>')).toEqual(expected)
      })

      it('should return a ref when og:image is outside the avatars path', () => {
        const url = 'https://example.com/c/news'
        const value = '<meta property="og:image" content="https://example.com/client/og.png" />'
        const expected = [createRef(url, 'c/news')]

        expect(peertubeHandler.resolve(url, value)).toEqual(expected)
      })
    })
  })
})

describe('peertubeEnricher', () => {
  describe('happy paths', () => {
    it('should resolve channel avatar from API', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': channelAvatars,
      })
      const ref = createRef('https://example.com/c/news', 'c/news')

      expect(await peertubeEnricher(ref, context)).toEqual([
        'https://example.com/lazy-static/avatars/1500.png',
      ])
    })

    it('should resolve account avatar from API', async () => {
      const context = createContext({
        'https://example.com/api/v1/accounts/alice': channelAvatars,
      })
      const ref = createRef('https://example.com/a/alice', 'a/alice')

      expect(await peertubeEnricher(ref, context)).toEqual([
        'https://example.com/lazy-static/avatars/1500.png',
      ])
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a ref of another platform', async () => {
      const ref: DiscoverRef = {
        platform: 'mastodon',
        id: 'user',
        url: 'https://example.com/@user',
      }

      expect(await peertubeEnricher(ref, createContext({}))).toBeUndefined()
    })

    it('should return empty array for an id of unknown kind', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': channelAvatars,
      })
      const ref = createRef('https://example.com/c/news', 'x/news')

      expect(await peertubeEnricher(ref, context)).toEqual([])
    })

    it('should return empty array when API has no avatars', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': JSON.stringify({ avatars: [] }),
      })
      const ref = createRef('https://example.com/c/news', 'c/news')

      expect(await peertubeEnricher(ref, context)).toEqual([])
    })

    it('should return empty array when API response lacks avatars field', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': JSON.stringify({ name: 'news' }),
      })
      const ref = createRef('https://example.com/c/news', 'c/news')

      expect(await peertubeEnricher(ref, context)).toEqual([])
    })

    it('should return empty array when avatars have empty paths', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': JSON.stringify({
          avatars: [{ width: 600, path: '' }],
        }),
      })
      const ref = createRef('https://example.com/c/news', 'c/news')

      expect(await peertubeEnricher(ref, context)).toEqual([])
    })

    it('should reject when API returns invalid JSON', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': 'not json',
      })
      const ref = createRef('https://example.com/c/news', 'c/news')
      const throwing = () => peertubeEnricher(ref, context)

      await expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
    })

    it('should reject when fetch throws', async () => {
      const fetchFn: FetchFn = () => {
        throw new Error('Network error')
      }
      const ref = createRef('https://example.com/c/news', 'c/news')
      const throwing = () => peertubeEnricher(ref, { fetchFn })

      await expect(throwing()).rejects.toThrow('Network error')
    })

    it('should reject when the response is not 2xx', async () => {
      const ref = createRef('https://example.com/c/news', 'c/news')
      const throwing = () => peertubeEnricher(ref, createContext({}))
      const expected = 'Unexpected status 404 from https://example.com/api/v1/video-channels/news'

      await expect(throwing()).rejects.toThrow(expected)
    })
  })

  describe('edge cases', () => {
    it('should pick 600 width avatar when 1500 is missing', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': JSON.stringify({
          avatars: [
            { width: 120, path: '/lazy-static/avatars/120.png' },
            { width: 600, path: '/lazy-static/avatars/600.png' },
          ],
        }),
      })
      const ref = createRef('https://example.com/c/news', 'c/news')

      expect(await peertubeEnricher(ref, context)).toEqual([
        'https://example.com/lazy-static/avatars/600.png',
      ])
    })

    it('should pick the largest avatar when only small ones exist', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news': JSON.stringify({
          avatars: [
            { width: 48, path: '/lazy-static/avatars/48.png' },
            { width: 120, path: '/lazy-static/avatars/120.png' },
          ],
        }),
      })
      const ref = createRef('https://example.com/c/news', 'c/news')

      expect(await peertubeEnricher(ref, context)).toEqual([
        'https://example.com/lazy-static/avatars/120.png',
      ])
    })

    it('should resolve remote channel through the local instance API', async () => {
      const context = createContext({
        'https://example.com/api/v1/video-channels/news@example.org': channelAvatars,
      })
      const ref = createRef('https://example.com/c/news@example.org', 'c/news@example.org')

      expect(await peertubeEnricher(ref, context)).toEqual([
        'https://example.com/lazy-static/avatars/1500.png',
      ])
    })

    it('should keep the port of the instance origin', async () => {
      const context = createContext({
        'https://example.com:8443/api/v1/accounts/alice': channelAvatars,
      })
      const ref = createRef('https://example.com:8443/a/alice', 'a/alice')

      expect(await peertubeEnricher(ref, context)).toEqual([
        'https://example.com:8443/lazy-static/avatars/1500.png',
      ])
    })
  })
})
