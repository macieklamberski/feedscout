import { describe, expect, it } from 'bun:test'
import type { DailymotionUrl } from './dailymotion.js'
import { dailymotionHandler, parseDailymotionUrl } from './dailymotion.js'

describe('parseDailymotionUrl', () => {
  const excludedValues: Array<string> = [
    'https://www.dailymotion.com/signin',
    'https://www.dailymotion.com/upload',
    'https://www.dailymotion.com/settings',
    'https://www.dailymotion.com/video',
    'https://www.dailymotion.com/login',
    'https://www.dailymotion.com/live',
    'https://www.dailymotion.com/trending',
  ]

  it('should return the user for a user page', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'bfmtv' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/bfmtv')).toEqual(expected)
  })

  it('should return the user for the host without www', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'nasa' }

    expect(parseDailymotionUrl('https://dailymotion.com/nasa')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'BFMTV' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/BFMTV')).toEqual(expected)
  })

  it('should return the playlist for a playlist page', () => {
    const expected: DailymotionUrl = { kind: 'playlist', playlistId: 'x7vjjm' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/playlist/x7vjjm')).toEqual(expected)
  })

  it('should return the playlist for a playlist page with a capitalized playlist segment', () => {
    const expected: DailymotionUrl = { kind: 'playlist', playlistId: 'x7vjjm' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/Playlist/x7vjjm')).toEqual(expected)
  })

  it('should return the playlist with underscores and dashes', () => {
    const value = 'https://www.dailymotion.com/playlist/x7vjjm_BFM-Story_bfm-story'
    const expected: DailymotionUrl = { kind: 'playlist', playlistId: 'x7vjjm_BFM-Story_bfm-story' }

    expect(parseDailymotionUrl(value)).toEqual(expected)
  })

  it('should return the channel for a channel page', () => {
    const expected: DailymotionUrl = { kind: 'channel', channel: 'news' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/channel/news')).toEqual(expected)
  })

  it('should return the query for a search page', () => {
    const expected: DailymotionUrl = { kind: 'search', query: 'cats' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/search/cats')).toEqual(expected)
  })

  it.each(excludedValues)('should return undefined for %s', (value) => {
    expect(parseDailymotionUrl(value)).toBeUndefined()
  })

  it('should return undefined for a user page with a trailing slash', () => {
    expect(parseDailymotionUrl('https://www.dailymotion.com/bfmtv/')).toBeUndefined()
  })

  it('should return undefined for a video page', () => {
    expect(parseDailymotionUrl('https://www.dailymotion.com/video/x8abc12')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseDailymotionUrl('https://www.dailymotion.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseDailymotionUrl('https://example.com/bfmtv')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDailymotionUrl('not-a-url')).toBeUndefined()
  })
})

describe('dailymotionHandler', () => {
  describe('match', () => {
    it('should match Dailymotion URLs', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/bfmtv')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(dailymotionHandler.match('https://example.com/dailymotion')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed for user page', () => {
      const value = 'https://www.dailymotion.com/bfmtv'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/bfmtv',
          hint: { key: 'dailymotion:videos', label: 'Videos' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed for playlist page', () => {
      const value = 'https://www.dailymotion.com/playlist/x7vjjm'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/playlist/x7vjjm',
          hint: { key: 'dailymotion:playlist', label: 'Playlist' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed for channel page', () => {
      const value = 'https://www.dailymotion.com/channel/news'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/channel/news',
          hint: { key: 'dailymotion:channel', label: 'Channel' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for homepage', () => {
      const value = 'https://www.dailymotion.com/'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: { key: 'dailymotion:trending', label: 'Trending' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending', () => {
      const value = 'https://www.dailymotion.com/trending'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: { key: 'dailymotion:trending', label: 'Trending' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending with trailing slash', () => {
      const value = 'https://www.dailymotion.com/trending/'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: { key: 'dailymotion:trending', label: 'Trending' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return search feed for /search/{query}', () => {
      const value = 'https://www.dailymotion.com/search/cats'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/search/cats',
          hint: { key: 'dailymotion:search', label: 'Search' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a page without a feed', () => {
      expect(dailymotionHandler.resolve('https://www.dailymotion.com/signin')).toEqual([])
    })
  })
})
