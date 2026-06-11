import { describe, expect, it } from 'bun:test'
import { dailymotionHandler } from './dailymotion.js'

describe('dailymotionHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.dailymotion.com/bfmtv'],
      [true, 'https://dailymotion.com/nasa'],
      [true, 'https://www.dailymotion.com/playlist/x7vjjm'],
      [true, 'https://www.dailymotion.com/signin'],
      [true, 'https://www.dailymotion.com/'],
      [false, 'https://example.com/dailymotion'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(dailymotionHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(dailymotionHandler.match('not-a-url')).toBe(false)
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

    it('should return RSS feed for playlist with underscores and dashes', () => {
      const value = 'https://www.dailymotion.com/playlist/x7vjjm_BFM-Story_bfm-story'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/playlist/x7vjjm_BFM-Story_bfm-story',
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

    const excludedValues: Array<string> = [
      'https://www.dailymotion.com/signin',
      'https://www.dailymotion.com/upload',
      'https://www.dailymotion.com/settings',
      'https://www.dailymotion.com/video',
      'https://www.dailymotion.com/login',
      'https://www.dailymotion.com/live',
    ]

    it.each(excludedValues)('should return empty array for %s', (value) => {
      expect(dailymotionHandler.resolve(value)).toEqual([])
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

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
