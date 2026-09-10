import { describe, expect, it } from 'bun:test'
import { kucoinHandler } from './kucoin.js'

describe('kucoinHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.kucoin.com'],
      [true, 'https://www.kucoin.com/news'],
      [true, 'https://kucoin.com/announcement'],
      [false, 'https://kucoin.com.example.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(kucoinHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(kucoinHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const expected = [
      {
        uri: 'https://www.kucoin.com/rss/news',
        hint: { key: 'kucoin:news', label: 'Announcements' },
      },
    ]

    it('should return the announcements feed for the homepage', () => {
      expect(kucoinHandler.resolve('https://www.kucoin.com')).toEqual(expected)
    })

    it('should return the announcements feed for the news page', () => {
      expect(kucoinHandler.resolve('https://www.kucoin.com/news')).toEqual(expected)
    })

    it('should return the announcements feed for the apex host', () => {
      expect(kucoinHandler.resolve('https://kucoin.com/announcement?lang=en_US')).toEqual(expected)
    })
  })
})
