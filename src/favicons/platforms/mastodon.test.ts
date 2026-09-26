import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { mastodonEnricher, mastodonHandler } from './mastodon.js'

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
  return { platform: 'mastodon', id, url }
}

describe('mastodonHandler', () => {
  describe('match', () => {
    it('should match profile path with Mastodon HTML', () => {
      const value = '<meta name="generator" content="Mastodon v4.2.0">'

      expect(mastodonHandler.match('https://example.com/@user', value)).toBe(true)
    })

    it('should match profile path with Mastodon server header', () => {
      expect(
        mastodonHandler.match('https://example.com/@user', '', new Headers({ server: 'Mastodon' })),
      ).toBe(true)
    })

    it('should match when both HTML and headers indicate Mastodon', () => {
      const value = '<meta name="generator" content="Mastodon v4.2.0">'

      expect(
        mastodonHandler.match(
          'https://example.com/@user',
          value,
          new Headers({ server: 'Mastodon' }),
        ),
      ).toBe(true)
    })

    it('should not match tag pages', () => {
      const value = '<meta name="generator" content="Mastodon v4.2.0">'

      expect(mastodonHandler.match('https://example.com/tags/news', value)).toBe(false)
    })

    it('should not match without Mastodon HTML signals', () => {
      expect(mastodonHandler.match('https://example.com/@user', '<html></html>')).toBe(false)
    })

    it('should not match without Mastodon header signals', () => {
      expect(
        mastodonHandler.match('https://example.com/@user', '', new Headers({ server: 'nginx' })),
      ).toBe(false)
    })

    it('should not match without content and headers', () => {
      expect(mastodonHandler.match('https://example.com/@user')).toBe(false)
    })

    it('should not match non-profile paths', () => {
      const value = '<meta name="generator" content="Mastodon v4.2.0">'

      expect(mastodonHandler.match('https://example.com/about', value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for the profile', async () => {
      const expected = [{ platform: 'mastodon', id: 'user', url: 'https://example.com/@user' }]

      expect(await mastodonHandler.resolve('https://example.com/@user')).toEqual(expected)
    })

    it('should return empty array for non-profile path', async () => {
      expect(await mastodonHandler.resolve('https://example.com/about')).toEqual([])
    })
  })
})

describe('mastodonEnricher', () => {
  it('should resolve avatar from Mastodon API', async () => {
    const context = createContext({
      'https://example.com/api/v1/accounts/lookup?acct=user': JSON.stringify({
        avatar: 'https://files.example.com/accounts/avatars/000/123/original/avatar.png',
      }),
    })
    const ref = createRef('https://example.com/@user', 'user')
    const expected = ['https://files.example.com/accounts/avatars/000/123/original/avatar.png']

    expect(await mastodonEnricher(ref, context)).toEqual(expected)
  })

  it('should resolve avatar from different instance', async () => {
    const context = createContext({
      'https://example.org/api/v1/accounts/lookup?acct=dev': JSON.stringify({
        avatar: 'https://media.example.org/avatars/dev.png',
      }),
    })
    const ref = createRef('https://example.org/@dev', 'dev')

    expect(await mastodonEnricher(ref, context)).toEqual([
      'https://media.example.org/avatars/dev.png',
    ])
  })

  // Port is stripped from API URL because the enricher uses hostname (not host).
  it('should resolve avatar from instance with port number', async () => {
    const context = createContext({
      'https://mastodon.local/api/v1/accounts/lookup?acct=user': JSON.stringify({
        avatar: 'https://mastodon.local:3000/avatars/user.png',
      }),
    })
    const ref = createRef('https://mastodon.local:3000/@user', 'user')

    expect(await mastodonEnricher(ref, context)).toEqual([
      'https://mastodon.local:3000/avatars/user.png',
    ])
  })

  it('should resolve avatar for a remote handle', async () => {
    const context = createContext({
      'https://example.com/api/v1/accounts/lookup?acct=user@example.net': JSON.stringify({
        avatar: 'https://example.net/avatars/user.png',
      }),
    })
    const ref = createRef('https://example.com/@user@example.net', 'user@example.net')

    expect(await mastodonEnricher(ref, context)).toEqual(['https://example.net/avatars/user.png'])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'bluesky',
      id: 'user',
      url: 'https://example.com/profile/user',
    }

    expect(await mastodonEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when avatar is empty string', async () => {
    const context = createContext({
      'https://example.com/api/v1/accounts/lookup?acct=user': JSON.stringify({ avatar: '' }),
    })
    const ref = createRef('https://example.com/@user', 'user')

    expect(await mastodonEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when avatar is not a string', async () => {
    const context = createContext({
      'https://example.com/api/v1/accounts/lookup?acct=user': JSON.stringify({ avatar: 123 }),
    })
    const ref = createRef('https://example.com/@user', 'user')

    expect(await mastodonEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when API returns no avatar', async () => {
    const context = createContext({
      'https://example.com/api/v1/accounts/lookup?acct=user': JSON.stringify({}),
    })
    const ref = createRef('https://example.com/@user', 'user')

    expect(await mastodonEnricher(ref, context)).toEqual([])
  })

  it('should reject when API returns invalid JSON', async () => {
    const context = createContext({
      'https://example.com/api/v1/accounts/lookup?acct=user': 'not json',
    })
    const ref = createRef('https://example.com/@user', 'user')
    const throwing = () => mastodonEnricher(ref, context)

    await expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const ref = createRef('https://example.com/@user', 'user')
    const throwing = () => mastodonEnricher(ref, { fetchFn })

    await expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', async () => {
    const ref = createRef('https://example.com/@user', 'user')
    const throwing = () => mastodonEnricher(ref, createContext({}))
    const expected =
      'Unexpected status 404 from https://example.com/api/v1/accounts/lookup?acct=user'

    await expect(throwing()).rejects.toThrow(expected)
  })
})
