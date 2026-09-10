import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { isMastodonHeaders, isMastodonHtml, isProfilePath, mastodonHandler } from './mastodon.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('isProfilePath', () => {
  it('should return true for /@ paths', () => {
    expect(isProfilePath('/@user')).toBe(true)
    expect(isProfilePath('/@admin')).toBe(true)
  })

  it('should return true for /@ path with trailing slash', () => {
    expect(isProfilePath('/@user/')).toBe(true)
  })

  it('should return false for multi-segment /@ paths', () => {
    expect(isProfilePath('/@user/123456789')).toBe(false)
    expect(isProfilePath('/@user/with/extra')).toBe(false)
  })

  it('should return false for paths without @', () => {
    expect(isProfilePath('/user')).toBe(false)
    expect(isProfilePath('/about')).toBe(false)
  })

  it('should return false for root path', () => {
    expect(isProfilePath('/')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isProfilePath('')).toBe(false)
  })
})

describe('isMastodonHtml', () => {
  it('should return true for standard Mastodon generator meta tag', () => {
    expect(isMastodonHtml('<meta name="generator" content="Mastodon v4.2.0">')).toBe(true)
  })

  it('should return true for case variations', () => {
    expect(isMastodonHtml('<meta name="generator" content="mastodon v4.0.0">')).toBe(true)
    expect(isMastodonHtml('<meta name="generator" content="MASTODON v4.0.0">')).toBe(true)
  })

  it('should return true for generator tag with single quotes', () => {
    expect(isMastodonHtml("<meta name='generator' content='Mastodon v4.2.0'>")).toBe(true)
  })

  it('should return true for tag within full HTML document', () => {
    const value = '<html><head><meta name="generator" content="Mastodon v4.2.0"></head></html>'

    expect(isMastodonHtml(value)).toBe(true)
  })

  it('should return false for non-Mastodon generator', () => {
    expect(isMastodonHtml('<meta name="generator" content="WordPress 6.0">')).toBe(false)
  })

  it('should return false for HTML without generator tag', () => {
    expect(isMastodonHtml('<html><head><title>Test</title></head></html>')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isMastodonHtml('')).toBe(false)
  })
})

describe('isMastodonHeaders', () => {
  it('should return true for Mastodon server header', () => {
    expect(isMastodonHeaders(new Headers({ server: 'Mastodon' }))).toBe(true)
  })

  it('should return true for case variations', () => {
    expect(isMastodonHeaders(new Headers({ server: 'mastodon' }))).toBe(true)
    expect(isMastodonHeaders(new Headers({ server: 'MASTODON' }))).toBe(true)
  })

  it('should return true for server header with version', () => {
    expect(isMastodonHeaders(new Headers({ server: 'Mastodon/4.2.0' }))).toBe(true)
  })

  it('should return true for server header containing Mastodon as substring', () => {
    expect(isMastodonHeaders(new Headers({ server: 'nginx (Mastodon)' }))).toBe(true)
  })

  it('should return false for non-Mastodon server', () => {
    expect(isMastodonHeaders(new Headers({ server: 'nginx' }))).toBe(false)
    expect(isMastodonHeaders(new Headers({ server: 'Apache' }))).toBe(false)
  })

  it('should return false for missing server header', () => {
    expect(isMastodonHeaders(new Headers())).toBe(false)
    expect(isMastodonHeaders(new Headers({ 'content-type': 'text/html' }))).toBe(false)
  })
})

describe('mastodonHandler', () => {
  describe('match', () => {
    it('should match profile path with Mastodon HTML', () => {
      const value = '<meta name="generator" content="Mastodon v4.2.0">'

      expect(mastodonHandler.match('https://mastodon.social/@user', value)).toBe(true)
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

    it('should not match without Mastodon signals', () => {
      expect(mastodonHandler.match('https://example.com/@user', '<html></html>')).toBe(false)
      expect(
        mastodonHandler.match('https://example.com/@user', '', new Headers({ server: 'nginx' })),
      ).toBe(false)
    })

    it('should not match without content and headers', () => {
      expect(mastodonHandler.match('https://mastodon.social/@user')).toBe(false)
    })

    it('should not match non-profile paths', () => {
      const value = '<meta name="generator" content="Mastodon v4.2.0">'

      expect(mastodonHandler.match('https://mastodon.social/about', value)).toBe(false)
      expect(mastodonHandler.match('https://mastodon.social/', value)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(mastodonHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve avatar from Mastodon API', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({
          avatar: 'https://files.mastodon.social/accounts/avatars/000/123/original/avatar.png',
        }),
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://files.mastodon.social/accounts/avatars/000/123/original/avatar.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should resolve avatar from different instance', async () => {
      const mockFetch = createMockFetch({
        'https://hachyderm.io/api/v1/accounts/lookup?acct=dev': JSON.stringify({
          avatar: 'https://media.hachyderm.io/avatars/dev.png',
        }),
      })
      const result = await mastodonHandler.resolve(
        'https://hachyderm.io/@dev',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://media.hachyderm.io/avatars/dev.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const result = await mastodonHandler.resolve('https://mastodon.social/@user')

      expect(result).toEqual([])
    })

    it('should return empty array when avatar is empty string', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({ avatar: '' }),
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when avatar is not a string', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({ avatar: 123 }),
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when API returns no avatar', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({}),
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array when API returns invalid JSON', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': 'not json',
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
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
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      const mockFetch = createMockFetch({})
      const result = await mastodonHandler.resolve('not-a-url', undefined, undefined, mockFetch)

      expect(result).toEqual([])
    })

    // Port is stripped from API URL because handler uses hostname (not host).
    it('should resolve avatar from instance with port number', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.local/api/v1/accounts/lookup?acct=user': JSON.stringify({
          avatar: 'https://mastodon.local:3000/avatars/user.png',
        }),
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.local:3000/@user',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://mastodon.local:3000/avatars/user.png' },
      ]

      expect(result).toEqual(expected)
    })

    it('should resolve avatar from /@user@domain format', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user@remote.social': JSON.stringify({
          avatar: 'https://remote.social/avatars/user.png',
        }),
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user@remote.social',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://remote.social/avatars/user.png' }]

      expect(result).toEqual(expected)
    })

    it('should return empty array for non-profile path', async () => {
      const mockFetch = createMockFetch({})
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/about',
        undefined,
        undefined,
        mockFetch,
      )

      expect(result).toEqual([])
    })

    it('should strip feed extension from profile URL', async () => {
      const mockFetch = createMockFetch({
        'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({
          avatar: 'https://mastodon.social/avatars/user.png',
        }),
      })
      const result = await mastodonHandler.resolve(
        'https://mastodon.social/@user.rss',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://mastodon.social/avatars/user.png' },
      ]

      expect(result).toEqual(expected)
    })
  })
})
