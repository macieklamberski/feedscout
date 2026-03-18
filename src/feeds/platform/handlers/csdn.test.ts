import { describe, expect, it } from 'bun:test'
import { csdnHandler } from './csdn.js'

describe('csdnHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://blog.csdn.net/csdnnews', true],
      ['https://www.csdn.net/', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(csdnHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(csdnHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user blog', () => {
      const value = 'https://blog.csdn.net/csdnnews'
      const expected = [
        {
          uri: ['https://rss.csdn.net/csdnnews/rss/map', 'https://blog.csdn.net/csdnnews/rss/list'],
          hint: { key: 'csdn:blog', label: 'Blog' },
        },
      ]

      expect(csdnHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for user blog with subpath', () => {
      const value = 'https://blog.csdn.net/csdnnews/article/details/12345'
      const expected = [
        {
          uri: ['https://rss.csdn.net/csdnnews/rss/map', 'https://blog.csdn.net/csdnnews/rss/list'],
          hint: { key: 'csdn:blog', label: 'Blog' },
        },
      ]

      expect(csdnHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://blog.csdn.net/'

      expect(csdnHandler.resolve(value)).toEqual([])
    })
  })
})
