import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { mastodonHandler } from './mastodon.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

const mastodonHtml = '<html><head><meta name="generator" content="Mastodon v4.2.0"></head></html>'
const mastodonHeaders = new Headers({ server: 'Mastodon' })

describe('mastodonHandler', () => {
  describe('match', () => {
    it('should match /@ profile path with Mastodon generator in HTML', () => {
      expect(mastodonHandler.match('https://mastodon.social/@user', mastodonHtml)).toBe(true)
      expect(mastodonHandler.match('https://example.com/@user', mastodonHtml)).toBe(true)
    })

    it('should match /@ profile path with Mastodon server header', () => {
      const result = mastodonHandler.match('https://example.com/@user', '', mastodonHeaders)

      expect(result).toBe(true)
    })

    it('should match when both HTML and headers indicate Mastodon', () => {
      const result = mastodonHandler.match(
        'https://example.com/@user',
        mastodonHtml,
        mastodonHeaders,
      )

      expect(result).toBe(true)
    })

    it('should not match without Mastodon signals', () => {
      const result = mastodonHandler.match(
        'https://example.com/@user',
        '<html></html>',
        new Headers({ server: 'nginx' }),
      )

      expect(mastodonHandler.match('https://example.com/@user', '<html></html>')).toBe(false)
      expect(result).toBe(false)
    })

    it('should not match without content and headers', () => {
      expect(mastodonHandler.match('https://mastodon.social/@user')).toBe(false)
      expect(mastodonHandler.match('https://mastodon.social/@user', '')).toBe(false)
    })

    it('should not match non-profile paths', () => {
      expect(mastodonHandler.match('https://mastodon.social/about', mastodonHtml)).toBe(false)
      expect(mastodonHandler.match('https://mastodon.social/', mastodonHtml)).toBe(false)
    })

    it('should not match non-@ profile paths', () => {
      expect(mastodonHandler.match('https://mastodon.social/user', mastodonHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(mastodonHandler.match('not-a-url', mastodonHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve avatar from Mastodon API', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({
          avatar: 'https://files.mastodon.social/accounts/avatars/000/123/original/avatar.png',
        }),
      })
      const value = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        mastodonHtml,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://files.mastodon.social/accounts/avatars/000/123/original/avatar.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const value = await mastodonHandler.resolve('https://mastodon.social/@user', mastodonHtml)

      expect(value).toEqual([])
    })

    it('should return empty array when API returns no avatar', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({}),
      })
      const value = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        mastodonHtml,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns invalid JSON', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': 'not json',
      })
      const value = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        mastodonHtml,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when fetch throws', async () => {
      const mockFetch: DiscoverFetchFn = async () => {
        throw new Error('Network error')
      }
      const value = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        mastodonHtml,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should use correct API URL for different instances', async () => {
      const mockFetch = createMockFetch({
        'https://hachyderm.io/api/v1/accounts/lookup?acct=dev': JSON.stringify({
          avatar: 'https://media.hachyderm.io/avatars/dev.png',
        }),
      })
      const value = await mastodonHandler.resolve(
        'https://hachyderm.io/@dev',
        mastodonHtml,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://media.hachyderm.io/avatars/dev.png' },
      ]

      expect(value).toEqual(expected)
    })
  })
})
