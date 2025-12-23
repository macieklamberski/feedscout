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
  })

  describe('resolve', () => {
    it('should return RSS feed for user page', () => {
      const value = 'https://www.dailymotion.com/bfmtv'
      const expected = ['https://www.dailymotion.com/rss/user/bfmtv']

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed for playlist page', () => {
      const value = 'https://www.dailymotion.com/playlist/x7vjjm'
      const expected = ['https://www.dailymotion.com/rss/playlist/x7vjjm']

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should normalize username to lowercase', () => {
      const value = 'https://www.dailymotion.com/NASA'
      const expected = ['https://www.dailymotion.com/rss/user/nasa']

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://www.dailymotion.com/signin',
        'https://www.dailymotion.com/upload',
        'https://www.dailymotion.com/settings',
      ]

      for (const value of values) {
        expect(dailymotionHandler.resolve(value)).toEqual([])
      }
    })

    it('should return empty array for homepage', () => {
      const value = 'https://www.dailymotion.com/'

      expect(dailymotionHandler.resolve(value)).toEqual([])
    })
  })
})
