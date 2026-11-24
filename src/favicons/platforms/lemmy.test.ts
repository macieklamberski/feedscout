import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import {
  isLemmyHeaders,
  isLemmyHtml,
  type LemmyUrl,
  lemmyEnricher,
  lemmyHandler,
  parseLemmyUrl,
} from './lemmy.js'

const generatorHtml = '<html><head><meta name="generator" content="Lemmy v0.19.5"></head></html>'

describe('parseLemmyUrl', () => {
  it('should return the community for a community page', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://example.com/c/programming')).toEqual(expected)
  })

  it('should return the community for a community subpage', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://example.com/c/programming/hot')).toEqual(expected)
  })

  it('should return a federated community with its instance', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'rust@example.net' }

    expect(parseLemmyUrl('https://example.com/c/rust@example.net')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://example.com/u/alice')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://example.com/u/alice/posts')).toEqual(expected)
  })

  it('should return a federated user with its instance', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice@example.net' }

    expect(parseLemmyUrl('https://example.com/u/alice@example.net')).toEqual(expected)
  })

  it('should return the community on any host', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'worldnews' }

    expect(parseLemmyUrl('https://example.org/c/worldnews')).toEqual(expected)
  })

  it('should read a prefix without a name as the instance home', () => {
    const expected: LemmyUrl = { kind: 'home' }

    expect(parseLemmyUrl('https://example.com/c/')).toEqual(expected)
  })

  it('should return the community for a capitalized prefix', () => {
    const expected: LemmyUrl = { kind: 'community', community: 'programming' }

    expect(parseLemmyUrl('https://example.com/C/programming')).toEqual(expected)
  })

  it('should return the user for a capitalized prefix', () => {
    const expected: LemmyUrl = { kind: 'user', username: 'alice' }

    expect(parseLemmyUrl('https://example.com/U/alice')).toEqual(expected)
  })

  it('should return the home page', () => {
    const expected: LemmyUrl = { kind: 'home' }

    expect(parseLemmyUrl('https://example.com/')).toEqual(expected)
  })

  it('should return the sort and limit from the query', () => {
    const value = 'https://example.com/c/programming?sort=New&limit=10'
    const expected: LemmyUrl = {
      kind: 'community',
      community: 'programming',
      sort: 'New',
      limit: '10',
    }

    expect(parseLemmyUrl(value)).toEqual(expected)
  })

  it('should read a post page as the instance home', () => {
    const expected: LemmyUrl = { kind: 'home' }

    expect(parseLemmyUrl('https://example.com/post/123')).toEqual(expected)
  })

  it('should read a page with no name as the instance home', () => {
    const expected: LemmyUrl = { kind: 'home' }

    expect(parseLemmyUrl('https://example.com/communities')).toEqual(expected)
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLemmyUrl('not-a-url')).toBeUndefined()
  })
})

describe('isLemmyHtml', () => {
  it('should return true for Lemmy generator meta tag', () => {
    expect(isLemmyHtml('<meta name="generator" content="Lemmy v0.19.5">')).toBe(true)
    expect(isLemmyHtml('<meta name="generator" content="Lemmy">')).toBe(true)
  })

  it('should return true regardless of attribute order', () => {
    expect(isLemmyHtml('<meta content="Lemmy v0.19.5" name="generator">')).toBe(true)
  })

  it('should return true when embedded in full HTML', () => {
    expect(isLemmyHtml(generatorHtml)).toBe(true)
  })

  it('should return true for the lemmy-site app root without generator meta', () => {
    expect(isLemmyHtml('<body><div class="lemmy-site" id="app"></div></body>')).toBe(true)
  })

  it('should return true for the lemmy-site app root with another class', () => {
    expect(isLemmyHtml('<body><div class="lemmy-site dark"></div></body>')).toBe(true)
  })

  it('should return false for a lemmy-site substring outside a class attribute', () => {
    expect(isLemmyHtml('<a href="#/#lemmy-space:example.org">room</a>')).toBe(false)
    expect(isLemmyHtml('<p>class lemmy-site</p>')).toBe(false)
  })

  it('should return false for non-Lemmy generator values', () => {
    expect(isLemmyHtml('<meta name="generator" content="Mastodon v4.2.0">')).toBe(false)
    expect(isLemmyHtml('<meta name="generator" content="WordPress 6.4">')).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isLemmyHtml('')).toBe(false)
  })
})

describe('isLemmyHeaders', () => {
  it('should return true for x-powered-by: Lemmy header', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'Lemmy' }))).toBe(true)
  })

  it('should return true case-insensitively', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'lemmy' }))).toBe(true)
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'LEMMY' }))).toBe(true)
  })

  it('should return false when header is absent', () => {
    expect(isLemmyHeaders(new Headers())).toBe(false)
    expect(isLemmyHeaders(new Headers({ server: 'nginx' }))).toBe(false)
  })

  it('should return false for non-Lemmy x-powered-by values', () => {
    expect(isLemmyHeaders(new Headers({ 'x-powered-by': 'Express' }))).toBe(false)
  })
})

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
  return { platform: 'lemmy', id, url }
}

const lemmyHtml = '<html><body class="lemmy-site"></body></html>'
const lemmyHeaders = new Headers({ 'x-powered-by': 'Lemmy' })
const communityApiUrl = 'https://example.com/api/v3/community?name=technology'
const userApiUrl = 'https://example.com/api/v3/user?username=alice&limit=1'

describe('lemmyHandler', () => {
  describe('match', () => {
    it('should match community page with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://example.com/c/technology', lemmyHtml)).toBe(true)
    })

    it('should match community page with Lemmy header', () => {
      expect(lemmyHandler.match('https://example.com/c/technology', '', lemmyHeaders)).toBe(true)
    })

    it('should not match community page without Lemmy markers', () => {
      expect(lemmyHandler.match('https://example.com/c/technology', '<html></html>')).toBe(false)
    })

    it('should not match community page with other headers', () => {
      const headers = new Headers({ 'x-powered-by': 'Express' })

      expect(lemmyHandler.match('https://example.com/c/technology', '', headers)).toBe(false)
    })

    it('should not match home page', () => {
      expect(lemmyHandler.match('https://example.com/', lemmyHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve community icon from og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://example.com/pictrs/image/community.png"
          >
        `
        const expected = [{ uri: 'https://example.com/pictrs/image/community.png' }]

        expect(lemmyHandler.resolve('https://example.com/c/technology', value)).toEqual(expected)
      })

      it('should return a community ref without content', () => {
        const url = 'https://example.com/c/technology'
        const expected = [createRef(url, 'c/technology')]

        expect(lemmyHandler.resolve(url)).toEqual(expected)
      })

      it('should return a user ref without content', () => {
        const url = 'https://example.com/u/alice'
        const expected = [createRef(url, 'u/alice')]

        expect(lemmyHandler.resolve(url)).toEqual(expected)
      })
    })

    describe('edge cases', () => {
      it('should return a ref when page has no og:image', () => {
        const url = 'https://example.com/c/technology'
        const expected = [createRef(url, 'c/technology')]

        expect(lemmyHandler.resolve(url, lemmyHtml)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a page without a community or user', () => {
        expect(lemmyHandler.resolve('https://example.com/', lemmyHtml)).toEqual([])
      })
    })
  })
})

describe('lemmyEnricher', () => {
  describe('happy paths', () => {
    it('should resolve community icon from API', async () => {
      const context = createContext({
        [communityApiUrl]: JSON.stringify({
          community_view: {
            community: { icon: 'https://example.com/pictrs/image/community.png' },
          },
        }),
      })
      const ref = createRef('https://example.com/c/technology', 'c/technology')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://example.com/pictrs/image/community.png',
      ])
    })

    it('should resolve user avatar from API', async () => {
      const context = createContext({
        [userApiUrl]: JSON.stringify({
          person_view: {
            person: { avatar: 'https://example.com/pictrs/image/avatar.jpeg' },
          },
        }),
      })
      const ref = createRef('https://example.com/u/alice', 'u/alice')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://example.com/pictrs/image/avatar.jpeg',
      ])
    })
  })

  describe('sad paths', () => {
    it('should return undefined for a ref of another platform', async () => {
      const ref: DiscoverRef = {
        platform: 'mastodon',
        id: 'alice',
        url: 'https://example.com/@alice',
      }

      expect(await lemmyEnricher(ref, createContext({}))).toBeUndefined()
    })

    it('should return empty array for an id of unknown kind', async () => {
      const ref = createRef('https://example.com/post/123', 'x/technology')

      expect(await lemmyEnricher(ref, createContext({}))).toEqual([])
    })

    it('should return empty array when community has no icon', async () => {
      const context = createContext({
        [communityApiUrl]: JSON.stringify({
          community_view: { community: { name: 'technology' } },
        }),
      })
      const ref = createRef('https://example.com/c/technology', 'c/technology')

      expect(await lemmyEnricher(ref, context)).toEqual([])
    })

    it('should return empty array when user has no avatar', async () => {
      const context = createContext({
        [userApiUrl]: JSON.stringify({ person_view: { person: { name: 'alice' } } }),
      })
      const ref = createRef('https://example.com/u/alice', 'u/alice')

      expect(await lemmyEnricher(ref, context)).toEqual([])
    })

    it('should reject when API returns invalid JSON', () => {
      const context = createContext({ [communityApiUrl]: 'not json' })
      const ref = createRef('https://example.com/c/technology', 'c/technology')
      const throwing = () => lemmyEnricher(ref, context)

      expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
    })

    it('should reject when fetch throws', () => {
      const fetchFn: FetchFn = () => {
        throw new Error('Network error')
      }
      const ref = createRef('https://example.com/c/technology', 'c/technology')
      const throwing = () => lemmyEnricher(ref, { fetchFn })

      expect(throwing()).rejects.toThrow('Network error')
    })

    it('should reject when the response is not 2xx', () => {
      const ref = createRef('https://example.com/c/technology', 'c/technology')
      const throwing = () => lemmyEnricher(ref, createContext({}))
      const expected =
        'Unexpected status 404 from https://example.com/api/v3/community?name=technology'

      expect(throwing()).rejects.toThrow(expected)
    })
  })

  describe('edge cases', () => {
    it('should resolve federated community through the local instance API', async () => {
      const context = createContext({
        'https://example.com/api/v3/community?name=rust@example.net': JSON.stringify({
          community_view: {
            community: { icon: 'https://example.net/pictrs/image/rust.png' },
          },
        }),
      })
      const ref = createRef('https://example.com/c/rust@example.net', 'c/rust@example.net')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://example.net/pictrs/image/rust.png',
      ])
    })

    it('should resolve federated user through the local instance API', async () => {
      const context = createContext({
        'https://example.com/api/v3/user?username=alice@example.net&limit=1': JSON.stringify({
          person_view: {
            person: { avatar: 'https://example.net/pictrs/image/alice.png' },
          },
        }),
      })
      const ref = createRef('https://example.com/u/alice@example.net', 'u/alice@example.net')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://example.net/pictrs/image/alice.png',
      ])
    })
  })
})
