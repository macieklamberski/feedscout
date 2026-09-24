import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { velogEnricher, velogHandler } from './velog.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createResponse = (thumbnail: unknown): string => {
  return JSON.stringify({ data: { user: { profile: { thumbnail } } } })
}

const apiUrl =
  'https://v2.velog.io/graphql?query=%7Buser%28username%3A%22alice%22%29%7Bprofile%7Bthumbnail%7D%7D%7D'

const ref: DiscoverRef = {
  platform: 'velog',
  id: 'alice',
  url: 'https://velog.io/@alice',
}

const squareAvatar =
  'https://velog.velcdn.com/cdn-cgi/image/width=256,height=256,fit=cover/images/alice/profile/0f3c/avatar.png'

const profileHtml = `
  <div class="UserProfile_left__NbH_X">
    <img
      alt="profile"
      fetchPriority="high"
      width="128"
      height="128"
      src="https://images.velog.io/images/alice/profile/0f3c/avatar.png"
    />
  </div>
`

const postHtml = `
  <img
    src="https://velog.velcdn.com/images/alice/profile/0f3c/avatar.png"
    alt="profile"
  />
`

const placeholderHtml = `
  <img
    alt="profile"
    src="https://velog.velcdn.com/images/user-thumbnail.png"
  />
`

const otherHostHtml = `
  <img
    alt="profile"
    src="https://example.com/images/alice/profile/0f3c/avatar.png"
  />
`

describe('velogHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(velogHandler.match('https://velog.io/@alice')).toBe(true)
    })

    it('should match profile subpages', () => {
      expect(velogHandler.match('https://velog.io/@alice/posts')).toBe(true)
      expect(velogHandler.match('https://velog.io/@alice/series')).toBe(true)
      expect(velogHandler.match('https://velog.io/@alice/about')).toBe(true)
    })

    it('should match post URLs', () => {
      expect(velogHandler.match('https://velog.io/@alice/hello-world')).toBe(true)
    })

    it('should match www.velog.io profile URLs', () => {
      expect(velogHandler.match('https://www.velog.io/@alice')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(velogHandler.match('https://velog.io/')).toBe(false)
    })

    it('should not match non-profile paths', () => {
      expect(velogHandler.match('https://velog.io/recent')).toBe(false)
      expect(velogHandler.match('https://velog.io/tags/react')).toBe(false)
    })

    it('should not match non-velog URLs', () => {
      expect(velogHandler.match('https://example.com/@alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(velogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return square avatar from profile page HTML', async () => {
        const expected: Array<DiscoverUriEntry> = [{ uri: squareAvatar }]

        expect(await velogHandler.resolve('https://velog.io/@alice', profileHtml)).toEqual(expected)
      })

      it('should return square avatar from post page HTML', async () => {
        const url = 'https://velog.io/@alice/hello-world'
        const expected: Array<DiscoverUriEntry> = [{ uri: squareAvatar }]

        expect(await velogHandler.resolve(url, postHtml)).toEqual(expected)
      })

      it('should return a ref when content is absent', async () => {
        const url = 'https://velog.io/@alice/series'
        const expected: Array<DiscoverRef> = [{ platform: 'velog', id: 'alice', url }]

        expect(await velogHandler.resolve(url)).toEqual(expected)
      })

      it('should return a ref when HTML has no profile image', async () => {
        const url = 'https://velog.io/@alice'
        const expected: Array<DiscoverRef> = [{ platform: 'velog', id: 'alice', url }]

        expect(await velogHandler.resolve(url, '<html><body></body></html>')).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the home page', async () => {
        expect(await velogHandler.resolve('https://velog.io/', profileHtml)).toEqual([])
      })

      it('should return empty array for invalid URL', async () => {
        expect(await velogHandler.resolve('not-a-url', profileHtml)).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should return a ref instead of the placeholder image', async () => {
        const url = 'https://velog.io/@alice'
        const expected: Array<DiscoverRef> = [{ platform: 'velog', id: 'alice', url }]

        expect(await velogHandler.resolve(url, placeholderHtml)).toEqual(expected)
      })

      it('should return a ref instead of an image on another host', async () => {
        const url = 'https://velog.io/@alice'
        const expected: Array<DiscoverRef> = [{ platform: 'velog', id: 'alice', url }]

        expect(await velogHandler.resolve(url, otherHostHtml)).toEqual(expected)
      })

      it('should decode an encoded username', async () => {
        const url = 'https://velog.io/@%EA%B9%80'
        const expected: Array<DiscoverRef> = [{ platform: 'velog', id: '김', url }]

        expect(await velogHandler.resolve(url)).toEqual(expected)
      })
    })
  })
})

describe('velogEnricher', () => {
  it('should return square avatar from the GraphQL API', async () => {
    const context = createContext({
      [apiUrl]: createResponse('https://images.velog.io/images/alice/profile/0f3c/avatar.png'),
    })

    expect(await velogEnricher(ref, context)).toEqual([squareAvatar])
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = {
      platform: 'mastodon',
      id: 'alice',
      url: 'https://example.com/@alice',
    }

    expect(await velogEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array for the placeholder thumbnail', async () => {
    const context = createContext({
      [apiUrl]: createResponse('https://velog.velcdn.com/images/user-thumbnail.png'),
    })

    expect(await velogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array for a thumbnail on another host', async () => {
    const context = createContext({
      [apiUrl]: createResponse('https://example.com/images/alice/profile/0f3c/avatar.png'),
    })

    expect(await velogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array for a thumbnail outside the images path', async () => {
    const context = createContext({
      [apiUrl]: createResponse('https://velog.velcdn.com/static/alice/avatar.png'),
    })

    expect(await velogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when thumbnail is null', async () => {
    const context = createContext({ [apiUrl]: createResponse(null) })

    expect(await velogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when user is unknown', async () => {
    const context = createContext({ [apiUrl]: JSON.stringify({ data: { user: null } }) })

    expect(await velogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when API returns invalid JSON', async () => {
    const context = createContext({ [apiUrl]: 'not json' })

    expect(await velogEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    expect(await velogEnricher(ref, { fetchFn })).toEqual([])
  })
})
