import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { redditEnricher, redditHandler } from './reddit.js'

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

describe('redditHandler', () => {
  describe('match', () => {
    it('should match subreddit URLs', () => {
      expect(redditHandler.match('https://reddit.com/r/javascript')).toBe(true)
    })

    it('should not match domain pages', () => {
      expect(redditHandler.match('https://reddit.com/domain/example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a subreddit ref', async () => {
      expect(await redditHandler.resolve('https://reddit.com/r/javascript')).toEqual([subredditRef])
    })

    it('should return a user ref for /u/ paths', async () => {
      expect(await redditHandler.resolve('https://reddit.com/u/spez')).toEqual([userRef])
    })

    it('should return the owner ref for a multireddit', async () => {
      const url = 'https://reddit.com/user/spez/m/news'
      const expected = [{ platform: 'reddit', id: 'user/spez', url }]

      expect(await redditHandler.resolve(url)).toEqual(expected)
    })

    it('should return empty array for domain pages', async () => {
      expect(await redditHandler.resolve('https://reddit.com/domain/example.com')).toEqual([])
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
    const throwing = () => redditEnricher(subredditRef, context)

    await expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => redditEnricher(subredditRef, { fetchFn })

    await expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', async () => {
    const throwing = () => redditEnricher(subredditRef, createContext({}))
    const expected = 'Unexpected status 404 from https://www.reddit.com/r/javascript/about.json'

    await expect(throwing()).rejects.toThrow(expected)
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
