import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { isSubredditPath, isUserPath, redditEnricher, redditHandler } from './reddit.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const subredditRef: DiscoverRef = {
  platform: 'reddit',
  id: 'r/javascript',
  url: 'https://reddit.com/r/javascript',
}

const userRef: DiscoverRef = {
  platform: 'reddit',
  id: 'user/spez',
  url: 'https://reddit.com/u/spez',
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
    it('should return a subreddit ref', async () => {
      expect(await redditHandler.resolve('https://reddit.com/r/javascript')).toEqual([subredditRef])
    })

    it('should return a user ref for /u/ paths', async () => {
      expect(await redditHandler.resolve('https://reddit.com/u/spez')).toEqual([userRef])
    })

    it('should return a user ref for /user/ paths', async () => {
      const url = 'https://reddit.com/user/spez'
      const expected: Array<DiscoverRef> = [{ platform: 'reddit', id: 'user/spez', url }]

      expect(await redditHandler.resolve(url)).toEqual(expected)
    })

    it('should strip feed extension from subreddit URL', async () => {
      const url = 'https://reddit.com/r/javascript.rss'
      const expected: Array<DiscoverRef> = [{ platform: 'reddit', id: 'r/javascript', url }]

      expect(await redditHandler.resolve(url)).toEqual(expected)
    })

    it('should strip feed extension from user URL', async () => {
      const url = 'https://reddit.com/u/spez.rss'
      const expected: Array<DiscoverRef> = [{ platform: 'reddit', id: 'user/spez', url }]

      expect(await redditHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for non-subreddit and non-user path', async () => {
      expect(await redditHandler.resolve('https://reddit.com/about')).toEqual([])
    })
  })
})

describe('redditEnricher', () => {
  it('should resolve subreddit icon from community_icon', async () => {
    const context = createContext({
      'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
        data: { community_icon: 'https://styles.redditmedia.com/icon.png?v=1' },
      }),
    })

    expect(await redditEnricher(subredditRef, context)).toEqual([
      'https://styles.redditmedia.com/icon.png',
    ])
  })

  it('should resolve subreddit icon from icon_img when community_icon is empty', async () => {
    const context = createContext({
      'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
        data: { community_icon: '', icon_img: 'https://b.thumbs.redditmedia.com/icon.png' },
      }),
    })

    expect(await redditEnricher(subredditRef, context)).toEqual([
      'https://b.thumbs.redditmedia.com/icon.png',
    ])
  })

  it('should resolve user icon from icon_img', async () => {
    const context = createContext({
      'https://www.reddit.com/user/spez/about.json': JSON.stringify({
        data: { icon_img: 'https://styles.redditmedia.com/user-icon.png' },
      }),
    })

    expect(await redditEnricher(userRef, context)).toEqual([
      'https://styles.redditmedia.com/user-icon.png',
    ])
  })

  it('should resolve user icon from snoovatar_img when icon_img is empty', async () => {
    const context = createContext({
      'https://www.reddit.com/user/spez/about.json': JSON.stringify({
        data: { icon_img: '', snoovatar_img: 'https://i.redd.it/snoovatar/snoo.png' },
      }),
    })

    expect(await redditEnricher(userRef, context)).toEqual(['https://i.redd.it/snoovatar/snoo.png'])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = { platform: 'mastodon', id: 'user', url: 'https://example.com/@user' }

    expect(await redditEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when subreddit icon fields are empty', async () => {
    const context = createContext({
      'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
        data: { community_icon: '', icon_img: '' },
      }),
    })

    expect(await redditEnricher(subredditRef, context)).toEqual([])
  })

  it('should return empty array when subreddit data fields are missing', async () => {
    const context = createContext({
      'https://www.reddit.com/r/javascript/about.json': JSON.stringify({ data: {} }),
    })

    expect(await redditEnricher(subredditRef, context)).toEqual([])
  })

  it('should return empty array when user icon fields are empty', async () => {
    const context = createContext({
      'https://www.reddit.com/user/spez/about.json': JSON.stringify({
        data: { icon_img: '', snoovatar_img: '' },
      }),
    })

    expect(await redditEnricher(userRef, context)).toEqual([])
  })

  it('should return empty array when user data fields are missing', async () => {
    const context = createContext({
      'https://www.reddit.com/user/spez/about.json': JSON.stringify({ data: {} }),
    })

    expect(await redditEnricher(userRef, context)).toEqual([])
  })

  it('should reject when API returns invalid JSON', async () => {
    const context = createContext({
      'https://www.reddit.com/r/javascript/about.json': 'not json',
    })

    await expect(redditEnricher(subredditRef, context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(redditEnricher(subredditRef, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    await expect(redditEnricher(subredditRef, createContext({}))).rejects.toThrow()
  })

  it('should fall back to icon_img when community_icon is not a string', async () => {
    const context = createContext({
      'https://www.reddit.com/r/javascript/about.json': JSON.stringify({
        data: { community_icon: 42, icon_img: 'https://b.thumbs.redditmedia.com/fallback.png' },
      }),
    })
    const expected = ['https://b.thumbs.redditmedia.com/fallback.png']

    expect(await redditEnricher(subredditRef, context)).toEqual(expected)
  })
})
