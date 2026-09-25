import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { dailymotionEnricher, dailymotionHandler } from './dailymotion.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const userApiUrl = 'https://api.dailymotion.com/user/alice?fields=avatar_720_url'
const playlistApiUrl = 'https://api.dailymotion.com/playlist/x6abc1?fields=owner.avatar_720_url'
const userRef: DiscoverRef = {
  platform: 'dailymotion',
  id: 'user/alice',
  url: 'https://www.dailymotion.com/alice',
}
const playlistRef: DiscoverRef = {
  platform: 'dailymotion',
  id: 'playlist/x6abc1',
  url: 'https://www.dailymotion.com/playlist/x6abc1',
}

describe('dailymotionHandler', () => {
  describe('match', () => {
    it('should match user pages', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/alice')).toBe(true)
    })

    it('should not match channel pages', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/channel/news')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return a ref for a user page', async () => {
      const expected: Array<DiscoverRef> = [userRef]

      expect(await dailymotionHandler.resolve('https://www.dailymotion.com/alice')).toEqual(
        expected,
      )
    })

    it('should return a ref for a playlist page', async () => {
      const expected: Array<DiscoverRef> = [playlistRef]

      expect(
        await dailymotionHandler.resolve('https://www.dailymotion.com/playlist/x6abc1'),
      ).toEqual(expected)
    })

    it('should return empty array for a page without a user or playlist', async () => {
      expect(await dailymotionHandler.resolve('https://www.dailymotion.com/video/x8abc12')).toEqual(
        [],
      )
    })
  })
})

describe('dailymotionEnricher', () => {
  it('should return the user avatar', async () => {
    const context = createContext({
      [userApiUrl]: JSON.stringify({
        avatar_720_url: 'https://s2.dmcdn.net/u/QIeO1gi-tQgcpE5C/720x720',
      }),
    })

    expect(await dailymotionEnricher(userRef, context)).toEqual([
      'https://s2.dmcdn.net/u/QIeO1gi-tQgcpE5C/720x720',
    ])
  })

  it('should return the playlist owner avatar', async () => {
    const context = createContext({
      [playlistApiUrl]: JSON.stringify({
        'owner.avatar_720_url': 'https://s2.dmcdn.net/u/F8t6-1gj2AjxjHsSZ/720x720',
      }),
    })

    expect(await dailymotionEnricher(playlistRef, context)).toEqual([
      'https://s2.dmcdn.net/u/F8t6-1gj2AjxjHsSZ/720x720',
    ])
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'user',
      url: 'https://example.com/@user',
    }

    expect(await dailymotionEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array for the default avatar', async () => {
    const context = createContext({
      [userApiUrl]: JSON.stringify({
        avatar_720_url: 'https://s1.dmcdn.net/d/5000002HraHpp/720x720',
      }),
    })

    expect(await dailymotionEnricher(userRef, context)).toEqual([])
  })

  it('should return empty array when the account is not found', async () => {
    const context = createContext({
      [userApiUrl]: JSON.stringify({
        error: {
          code: 404,
          type: 'not_found',
        },
      }),
    })

    expect(await dailymotionEnricher(userRef, context)).toEqual([])
  })

  it('should return empty array when the avatar is empty', async () => {
    const context = createContext({
      [userApiUrl]: JSON.stringify({ avatar_720_url: '' }),
    })

    expect(await dailymotionEnricher(userRef, context)).toEqual([])
  })

  it('should reject when the API returns invalid JSON', () => {
    const context = createContext({
      [userApiUrl]: 'not-json',
    })
    const throwing = () => dailymotionEnricher(userRef, context)

    expect(throwing()).rejects.toThrow('JSON Parse error: Unexpected identifier "not"')
  })

  it('should reject when fetch throws', () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }
    const throwing = () => dailymotionEnricher(userRef, { fetchFn })

    expect(throwing()).rejects.toThrow('Network error')
  })

  it('should reject when the response is not 2xx', () => {
    const throwing = () => dailymotionEnricher(userRef, createContext({}))
    const expected =
      'Unexpected status 404 from https://api.dailymotion.com/user/alice?fields=avatar_720_url'

    expect(throwing()).rejects.toThrow(expected)
  })
})
