import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { hatenaBookmarkEnricher, hatenaBookmarkHandler } from './hatenaBookmark.js'

const avatarUrl = 'https://cdn.profile-image.st-hatena.com/users/jkondo/profile_256x256.png'
const defaultAvatarUrl =
  'https://cdn.profile-image.st-hatena.com/default_profile_images/profile_256x256.png'

const ref: DiscoverRef = {
  platform: 'hatenaBookmark',
  id: 'jkondo',
  url: 'https://b.hatena.ne.jp/jkondo/',
}

// Maps a requested URL to the URL the response ends at, after redirects.
const createContext = (finalUrls: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: '',
    url: finalUrls[url] ?? url,
    status: url in finalUrls ? 200 : 404,
  })

  return { fetchFn }
}

describe('hatenaBookmarkHandler', () => {
  describe('match', () => {
    it('should match user page URLs', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/jkondo/')).toBe(true)
    })

    it('should match user page URLs without trailing slash', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/jkondo')).toBe(true)
    })

    it('should match user subpage URLs', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/jkondo/bookmark')).toBe(true)
    })

    it('should match user IDs with hyphens and underscores', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/web-dev_jp/')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/')).toBe(false)
    })

    it('should not match category pages', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/hotentry/it')).toBe(false)
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/entrylist/it')).toBe(false)
    })

    it('should not match site section pages', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/site/example.com/')).toBe(false)
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/search/tag?q=rss')).toBe(false)
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/guide/')).toBe(false)
    })

    it('should not match files at the root', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/favicon.ico')).toBe(false)
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/hotentry.rss')).toBe(false)
    })

    it('should not match paths shorter than a Hatena ID', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/q/rss')).toBe(false)
    })

    it('should not match paths starting with a non-letter', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp/-/my/config')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(hatenaBookmarkHandler.match('https://example.com/jkondo/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(hatenaBookmarkHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a user page', async () => {
      expect(await hatenaBookmarkHandler.resolve('https://b.hatena.ne.jp/jkondo/')).toEqual([ref])
    })

    it('should return a ref for a user subpage', async () => {
      const url = 'https://b.hatena.ne.jp/jkondo/bookmark'
      const expected: Array<DiscoverRef> = [{ platform: 'hatenaBookmark', id: 'jkondo', url }]

      expect(await hatenaBookmarkHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for the home page', async () => {
      expect(await hatenaBookmarkHandler.resolve('https://b.hatena.ne.jp/')).toEqual([])
    })

    it('should return empty array for category pages', async () => {
      expect(await hatenaBookmarkHandler.resolve('https://b.hatena.ne.jp/hotentry/it')).toEqual([])
    })
  })
})

describe('hatenaBookmarkEnricher', () => {
  it('should return the avatar when it does not redirect to the default image', async () => {
    const context = createContext({ [avatarUrl]: avatarUrl })

    expect(await hatenaBookmarkEnricher(ref, context)).toEqual([avatarUrl])
  })

  it('should send a HEAD request for the avatar', async () => {
    let receivedMethod: string | undefined
    const fetchFn: FetchFn = (url, options) => {
      receivedMethod = options?.method

      return { headers: new Headers(), body: '', url, status: 200 }
    }

    await hatenaBookmarkEnricher(ref, { fetchFn })

    expect(receivedMethod).toBe('HEAD')
  })

  it('should return undefined for a ref of another platform', async () => {
    const otherRef: DiscoverRef = { platform: 'mastodon', id: 'jkondo', url: 'https://example.com' }

    expect(await hatenaBookmarkEnricher(otherRef, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the avatar redirects to the default image', async () => {
    const context = createContext({ [avatarUrl]: defaultAvatarUrl })

    expect(await hatenaBookmarkEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the avatar is not found', async () => {
    expect(await hatenaBookmarkEnricher(ref, createContext({}))).toEqual([])
  })

  it('should reject when the avatar request fails with another status', () => {
    const fetchFn: FetchFn = (url) => {
      return { headers: new Headers(), body: '', url, status: 503 }
    }
    const throwing = () => hatenaBookmarkEnricher(ref, { fetchFn })

    expect(throwing()).rejects.toThrow('Unexpected status 503')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(hatenaBookmarkEnricher(ref, { fetchFn })).rejects.toThrow()
  })
})
