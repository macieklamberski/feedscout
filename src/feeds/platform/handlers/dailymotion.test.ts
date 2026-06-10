import { describe, expect, it } from 'bun:test'
import { dailymotionHandler } from './dailymotion.js'

describe('dailymotionHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.dailymotion.com/bfmtv', true],
      ['https://dailymotion.com/nasa', true],
      ['https://www.dailymotion.com/playlist/x7vjjm', true],
      ['https://www.dailymotion.com/signin', true],
      ['https://www.dailymotion.com/', true],
      ['https://example.com/dailymotion', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://www.dailymotion.com/signin',
        'https://www.dailymotion.com/upload',
        'https://www.dailymotion.com/settings',
        'https://www.dailymotion.com/video',
        'https://www.dailymotion.com/login',
        'https://www.dailymotion.com/live',
      ]

      for (const value of values) {
        expect(dailymotionHandler.resolve(value)).toEqual([])
      }
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
  })
})
