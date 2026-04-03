import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { isSubredditPath, isUserPath, redditHandler } from './reddit.js'

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    url,
    body: responses[url] ?? '',
    headers: new Headers(),
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('isSubredditPath', () => {
  it('should return true for /r/subreddit paths', () => {
    expect(isSubredditPath('/r/javascript')).toBe(true)
    expect(isSubredditPath('/r/programming')).toBe(true)
  })

  it('should return true for /r/subreddit with extra segments', () => {
    expect(isSubredditPath('/r/javascript/hot')).toBe(true)
    expect(isSubredditPath('/r/javascript/comments/abc123')).toBe(true)
  })

  it('should return true for /r/subreddit with trailing slash', () => {
    expect(isSubredditPath('/r/javascript/')).toBe(true)
  })

  it('should return true for /r/subreddit with feed extension', () => {
    expect(isSubredditPath('/r/javascript.rss')).toBe(true)
    expect(isSubredditPath('/r/javascript.atom')).toBe(true)
  })

  it('should return false for /r without subreddit', () => {
    expect(isSubredditPath('/r')).toBe(false)
    expect(isSubredditPath('/r/')).toBe(false)
  })

  it('should return false for non-subreddit paths', () => {
    expect(isSubredditPath('/about')).toBe(false)
    expect(isSubredditPath('/u/user')).toBe(false)
  })

  it('should return false for case variation of /r', () => {
    expect(isSubredditPath('/R/javascript')).toBe(false)
  })

  it('should return false for root path', () => {
    expect(isSubredditPath('/')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isSubredditPath('')).toBe(false)
  })
})

describe('isUserPath', () => {
  it('should return true for /u/username paths', () => {
    expect(isUserPath('/u/spez')).toBe(true)
    expect(isUserPath('/u/admin')).toBe(true)
  })

  it('should return true for /user/username paths', () => {
    expect(isUserPath('/user/spez')).toBe(true)
    expect(isUserPath('/user/admin')).toBe(true)
  })

  it('should return true for user paths with extra segments', () => {
    expect(isUserPath('/u/spez/comments')).toBe(true)
    expect(isUserPath('/user/spez/submitted')).toBe(true)
  })

  it('should return true for user paths with trailing slash', () => {
    expect(isUserPath('/u/spez/')).toBe(true)
    expect(isUserPath('/user/spez/')).toBe(true)
  })

  it('should return true for user paths with feed extension', () => {
    expect(isUserPath('/u/spez.rss')).toBe(true)
    expect(isUserPath('/user/spez.atom')).toBe(true)
  })

  it('should return false for /u or /user without username', () => {
    expect(isUserPath('/u')).toBe(false)
    expect(isUserPath('/u/')).toBe(false)
    expect(isUserPath('/user')).toBe(false)
    expect(isUserPath('/user/')).toBe(false)
  })

  it('should return false for non-user paths', () => {
    expect(isUserPath('/r/javascript')).toBe(false)
    expect(isUserPath('/about')).toBe(false)
  })

  it('should return false for case variation of /u and /user', () => {
    expect(isUserPath('/U/spez')).toBe(false)
    expect(isUserPath('/User/spez')).toBe(false)
  })

  it('should return false for root path', () => {
    expect(isUserPath('/')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isUserPath('')).toBe(false)
  })
})

describe('redditHandler', () => {
  describe('match', () => {
    it('should match subreddit URLs', () => {
      expect(redditHandler.match('https://reddit.com/r/javascript')).toBe(true)
      expect(redditHandler.match('https://www.reddit.com/r/programming')).toBe(true)
    })

    it('should match user URLs', () => {
      expect(redditHandler.match('https://reddit.com/u/spez')).toBe(true)
      expect(redditHandler.match('https://reddit.com/user/spez')).toBe(true)
    })

    it('should match old.reddit.com and new.reddit.com', () => {
      expect(redditHandler.match('https://old.reddit.com/r/javascript')).toBe(true)
      expect(redditHandler.match('https://new.reddit.com/u/spez')).toBe(true)
    })

    it('should not match Reddit homepage', () => {
      expect(redditHandler.match('https://reddit.com/')).toBe(false)
      expect(redditHandler.match('https://reddit.com')).toBe(false)
    })

    it('should not match non-subreddit and non-user Reddit paths', () => {
      expect(redditHandler.match('https://reddit.com/about')).toBe(false)
      expect(redditHandler.match('https://reddit.com/wiki')).toBe(false)
    })

    it('should match URLs with feed extensions', () => {
      expect(redditHandler.match('https://www.reddit.com/r/javascript.rss')).toBe(true)
      expect(redditHandler.match('https://www.reddit.com/u/spez.rss')).toBe(true)
    })

    it('should not match non-Reddit URLs', () => {
      expect(redditHandler.match('https://example.com/r/javascript')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(redditHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve subreddit icon from community_icon', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
          data: { community_icon: 'https://styles.redditmedia.com/icon.png?v=1' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/r/javascript',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://styles.redditmedia.com/icon.png' }]

      expect(value).toEqual(expected)
    })

    it('should resolve subreddit icon from icon_img when community_icon is empty', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/programming/about.json': JSON.stringify({
          data: { community_icon: '', icon_img: 'https://b.thumbs.redditmedia.com/icon.png' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/r/programming',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://b.thumbs.redditmedia.com/icon.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should resolve user icon from icon_img', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/user/spez/about.json': JSON.stringify({
          data: { icon_img: 'https://styles.redditmedia.com/user-icon.png' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/u/spez',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://styles.redditmedia.com/user-icon.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should resolve user icon from snoovatar_img when icon_img is empty', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/user/spez/about.json': JSON.stringify({
          data: { icon_img: '', snoovatar_img: 'https://i.redd.it/snoovatar/snoo.png' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/user/spez',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://i.redd.it/snoovatar/snoo.png' }]

      expect(value).toEqual(expected)
    })

    it('should strip feed extension from subreddit URL', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
          data: { community_icon: 'https://styles.redditmedia.com/icon.png' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/r/javascript.rss',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://styles.redditmedia.com/icon.png' }]

      expect(value).toEqual(expected)
    })

    it('should strip feed extension from user URL', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/user/spez/about.json': JSON.stringify({
          data: { icon_img: 'https://styles.redditmedia.com/user-icon.png' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/u/spez.rss',
        undefined,
        undefined,
        mockFetch,
      )
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://styles.redditmedia.com/user-icon.png' },
      ]

      expect(value).toEqual(expected)
    })

    it('should return empty array when fetchFn is not provided', async () => {
      const value = await redditHandler.resolve('https://reddit.com/r/javascript')

      expect(value).toEqual([])
    })

    it('should return empty array for non-subreddit and non-user path', async () => {
      const mockFetch = createMockFetch({})
      const value = await redditHandler.resolve(
        'https://reddit.com/about',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when subreddit icon fields are empty', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
          data: { community_icon: '', icon_img: '' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/r/javascript',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when subreddit data fields are missing', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/javascript/about.json': JSON.stringify({ data: {} }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/r/javascript',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when user icon fields are empty', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/user/spez/about.json': JSON.stringify({
          data: { icon_img: '', snoovatar_img: '' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/u/spez',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when user data fields are missing', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/user/spez/about.json': JSON.stringify({ data: {} }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/u/spez',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when API returns invalid JSON', async () => {
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/javascript/about.json': 'not json',
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/r/javascript',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array when fetch throws', async () => {
      const mockFetch: DiscoverFetchFn = () => {
        throw new Error('Network error')
      }
      const value = await redditHandler.resolve(
        'https://reddit.com/r/javascript',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })

    it('should return empty array for invalid URL', async () => {
      const mockFetch = createMockFetch({})
      const value = await redditHandler.resolve('not-a-url', undefined, undefined, mockFetch)

      expect(value).toEqual([])
    })

    it('should return empty array when community_icon is non-string type', async () => {
      // When community_icon is a number, .split() throws and the catch block returns [].
      const mockFetch = createMockFetch({
        'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
          data: { community_icon: 42, icon_img: 'https://b.thumbs.redditmedia.com/fallback.png' },
        }),
      })
      const value = await redditHandler.resolve(
        'https://reddit.com/r/javascript',
        undefined,
        undefined,
        mockFetch,
      )

      expect(value).toEqual([])
    })
  })
})
