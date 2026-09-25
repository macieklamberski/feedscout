import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import {
  isMastodonHeaders,
  isMastodonHtml,
  isProfilePath,
  mastodonEnricher,
  mastodonHandler,
} from './mastodon.js'

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

  it('should return true for the mastodon app root without generator', () => {
    expect(isMastodonHtml('<body><div class="app-holder" id="mastodon"></div></body>')).toBe(true)
  })

  it('should return true for a single-quoted mastodon app root', () => {
    expect(isMastodonHtml("<body><div id='mastodon'></div></body>")).toBe(true)
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
    it('should return a ref for the profile', async () => {
      const expected: Array<DiscoverRef> = [
        { platform: 'mastodon', id: 'user', url: 'https://mastodon.social/@user' },
      ]

      expect(await mastodonHandler.resolve('https://mastodon.social/@user')).toEqual(expected)
    })

    it('should return a ref with the remote handle for /@user@domain', async () => {
      const url = 'https://mastodon.social/@user@remote.social'
      const expected: Array<DiscoverRef> = [{ platform: 'mastodon', id: 'user@remote.social', url }]

      expect(await mastodonHandler.resolve(url)).toEqual(expected)
    })

    it('should strip feed extension from profile URL', async () => {
      const url = 'https://mastodon.social/@user.rss'
      const expected: Array<DiscoverRef> = [{ platform: 'mastodon', id: 'user', url }]

      expect(await mastodonHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for non-profile path', async () => {
      expect(await mastodonHandler.resolve('https://mastodon.social/about')).toEqual([])
    })
  })
})

describe('mastodonEnricher', () => {
  it('should resolve avatar from Mastodon API', async () => {
    const context = createContext({
      'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({
        avatar: 'https://files.mastodon.social/accounts/avatars/000/123/original/avatar.png',
      }),
    })
    const ref = createRef('https://mastodon.social/@user', 'user')
    const expected = ['https://files.mastodon.social/accounts/avatars/000/123/original/avatar.png']

    expect(await mastodonEnricher(ref, context)).toEqual(expected)
  })

  it('should resolve avatar from different instance', async () => {
    const context = createContext({
      'https://hachyderm.io/api/v1/accounts/lookup?acct=dev': JSON.stringify({
        avatar: 'https://media.hachyderm.io/avatars/dev.png',
      }),
    })
    const ref = createRef('https://hachyderm.io/@dev', 'dev')

    expect(await mastodonEnricher(ref, context)).toEqual([
      'https://media.hachyderm.io/avatars/dev.png',
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
      'https://mastodon.social/api/v1/accounts/lookup?acct=user@remote.social': JSON.stringify({
        avatar: 'https://remote.social/avatars/user.png',
      }),
    })
    const ref = createRef('https://mastodon.social/@user@remote.social', 'user@remote.social')

    expect(await mastodonEnricher(ref, context)).toEqual(['https://remote.social/avatars/user.png'])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'bluesky',
      id: 'user',
      url: 'https://bsky.app/profile/user',
    }

    expect(await mastodonEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when avatar is empty string', async () => {
    const context = createContext({
      'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({ avatar: '' }),
    })
    const ref = createRef('https://mastodon.social/@user', 'user')

    expect(await mastodonEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when avatar is not a string', async () => {
    const context = createContext({
      'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({ avatar: 123 }),
    })
    const ref = createRef('https://mastodon.social/@user', 'user')

    expect(await mastodonEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when API returns no avatar', async () => {
    const context = createContext({
      'https://mastodon.social/api/v1/accounts/lookup?acct=user': JSON.stringify({}),
    })
    const ref = createRef('https://mastodon.social/@user', 'user')

    expect(await mastodonEnricher(ref, context)).toEqual([])
  })

  it('should reject when API returns invalid JSON', async () => {
    const context = createContext({
      'https://mastodon.social/api/v1/accounts/lookup?acct=user': 'not json',
    })
    const ref = createRef('https://mastodon.social/@user', 'user')

    await expect(mastodonEnricher(ref, context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const ref = createRef('https://mastodon.social/@user', 'user')

    await expect(mastodonEnricher(ref, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    const ref = createRef('https://mastodon.social/@user', 'user')

    await expect(mastodonEnricher(ref, createContext({}))).rejects.toThrow()
  })
})
