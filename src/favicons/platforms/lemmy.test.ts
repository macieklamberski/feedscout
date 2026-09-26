import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { lemmyEnricher, lemmyHandler } from './lemmy.js'

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
const communityApiUrl = 'https://lemmy.ml/api/v3/community?name=technology'
const userApiUrl = 'https://lemmy.ml/api/v3/user?username=alice&limit=1'

describe('lemmyHandler', () => {
  describe('match', () => {
    it('should match community page with Lemmy HTML', () => {
      expect(lemmyHandler.match('https://lemmy.ml/c/technology', lemmyHtml)).toBe(true)
    })

    it('should match community page with Lemmy header', () => {
      expect(lemmyHandler.match('https://lemmy.ml/c/technology', '', lemmyHeaders)).toBe(true)
    })

    it('should not match community page without Lemmy markers', () => {
      expect(lemmyHandler.match('https://example.com/c/technology', '<html></html>')).toBe(false)
    })

    it('should not match community page with other headers', () => {
      const headers = new Headers({ 'x-powered-by': 'Express' })

      expect(lemmyHandler.match('https://example.com/c/technology', '', headers)).toBe(false)
    })

    it('should not match home page', () => {
      expect(lemmyHandler.match('https://lemmy.ml/', lemmyHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should resolve community icon from og:image', () => {
        const value = `
          <meta
            property="og:image"
            content="https://lemmy.ml/pictrs/image/community.png"
          >
        `
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://lemmy.ml/pictrs/image/community.png' },
        ]

        expect(lemmyHandler.resolve('https://lemmy.ml/c/technology', value)).toEqual(expected)
      })

      it('should return a community ref without content', () => {
        const url = 'https://lemmy.ml/c/technology'
        const expected: Array<DiscoverRef> = [createRef(url, 'c/technology')]

        expect(lemmyHandler.resolve(url)).toEqual(expected)
      })

      it('should return a user ref without content', () => {
        const url = 'https://lemmy.ml/u/alice'
        const expected: Array<DiscoverRef> = [createRef(url, 'u/alice')]

        expect(lemmyHandler.resolve(url)).toEqual(expected)
      })
    })

    describe('edge cases', () => {
      it('should return a ref when page has no og:image', () => {
        const url = 'https://lemmy.ml/c/technology'
        const expected: Array<DiscoverRef> = [createRef(url, 'c/technology')]

        expect(lemmyHandler.resolve(url, lemmyHtml)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for a page without a community or user', () => {
        expect(lemmyHandler.resolve('https://lemmy.ml/', lemmyHtml)).toEqual([])
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
            community: { icon: 'https://lemmy.ml/pictrs/image/community.png' },
          },
        }),
      })
      const ref = createRef('https://lemmy.ml/c/technology', 'c/technology')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://lemmy.ml/pictrs/image/community.png',
      ])
    })

    it('should resolve user avatar from API', async () => {
      const context = createContext({
        [userApiUrl]: JSON.stringify({
          person_view: {
            person: { avatar: 'https://lemmy.ml/pictrs/image/avatar.jpeg' },
          },
        }),
      })
      const ref = createRef('https://lemmy.ml/u/alice', 'u/alice')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://lemmy.ml/pictrs/image/avatar.jpeg',
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
      const ref = createRef('https://lemmy.ml/post/123', 'x/technology')

      expect(await lemmyEnricher(ref, createContext({}))).toEqual([])
    })

    it('should return empty array when community has no icon', async () => {
      const context = createContext({
        [communityApiUrl]: JSON.stringify({
          community_view: { community: { name: 'technology' } },
        }),
      })
      const ref = createRef('https://lemmy.ml/c/technology', 'c/technology')

      expect(await lemmyEnricher(ref, context)).toEqual([])
    })

    it('should return empty array when user has no avatar', async () => {
      const context = createContext({
        [userApiUrl]: JSON.stringify({ person_view: { person: { name: 'alice' } } }),
      })
      const ref = createRef('https://lemmy.ml/u/alice', 'u/alice')

      expect(await lemmyEnricher(ref, context)).toEqual([])
    })

    it('should reject when API returns invalid JSON', async () => {
      const context = createContext({ [communityApiUrl]: 'not json' })
      const ref = createRef('https://lemmy.ml/c/technology', 'c/technology')
      const throwing = () => lemmyEnricher(ref, context)

      await expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
    })

    it('should reject when fetch throws', async () => {
      const fetchFn: FetchFn = () => {
        throw new Error('Network error')
      }
      const ref = createRef('https://lemmy.ml/c/technology', 'c/technology')
      const throwing = () => lemmyEnricher(ref, { fetchFn })

      await expect(throwing()).rejects.toThrow('Network error')
    })

    it('should reject when the response is not 2xx', async () => {
      const ref = createRef('https://lemmy.ml/c/technology', 'c/technology')
      const throwing = () => lemmyEnricher(ref, createContext({}))
      const expected =
        'Unexpected status 404 from https://lemmy.ml/api/v3/community?name=technology'

      await expect(throwing()).rejects.toThrow(expected)
    })
  })

  describe('edge cases', () => {
    it('should resolve federated community through the local instance API', async () => {
      const context = createContext({
        'https://lemmy.ml/api/v3/community?name=rust%40lemmy.world': JSON.stringify({
          community_view: {
            community: { icon: 'https://lemmy.world/pictrs/image/rust.png' },
          },
        }),
      })
      const ref = createRef('https://lemmy.ml/c/rust@lemmy.world', 'c/rust@lemmy.world')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://lemmy.world/pictrs/image/rust.png',
      ])
    })

    it('should resolve federated user through the local instance API', async () => {
      const context = createContext({
        'https://lemmy.ml/api/v3/user?username=alice%40lemmy.world&limit=1': JSON.stringify({
          person_view: {
            person: { avatar: 'https://lemmy.world/pictrs/image/alice.png' },
          },
        }),
      })
      const ref = createRef('https://lemmy.ml/u/alice@lemmy.world', 'u/alice@lemmy.world')

      expect(await lemmyEnricher(ref, context)).toEqual([
        'https://lemmy.world/pictrs/image/alice.png',
      ])
    })
  })
})
