import { describe, expect, it } from 'bun:test'
import { type CsdnUrl, csdnHandler, parseCsdnUrl } from './csdn.js'

describe('parseCsdnUrl', () => {
  it('should return the blog for an article page', () => {
    const expected: CsdnUrl = { kind: 'blog', username: 'someuser' }

    expect(parseCsdnUrl('https://blog.csdn.net/someuser/article/details/1')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseCsdnUrl('https://blog.csdn.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCsdnUrl('https://example.com/someuser')).toBeUndefined()
  })
})

describe('csdnHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://blog.csdn.net/csdnnews'],
      [false, 'https://www.csdn.net/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(csdnHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(csdnHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(csdnHandler.resolve('https://example.com/')).toEqual([])
    })

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
