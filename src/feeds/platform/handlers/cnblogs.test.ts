import { describe, expect, it } from 'bun:test'
import { cnblogsHandler } from './cnblogs.js'

describe('cnblogsHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(cnblogsHandler.match('https://www.cnblogs.com/example/')).toBe(true)
      expect(cnblogsHandler.match('https://cnblogs.com/example')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(cnblogsHandler.match('https://www.cnblogs.com/')).toBe(false)
    })

    it('should not match reserved paths', () => {
      expect(cnblogsHandler.match('https://www.cnblogs.com/news/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(cnblogsHandler.match('https://example.com/user')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(cnblogsHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed', () => {
      const value = 'https://www.cnblogs.com/example/'
      const expected = [
        {
          uri: 'https://www.cnblogs.com/example/rss',
          hint: { key: 'cnblogs:posts', label: 'Posts' },
        },
      ]

      expect(cnblogsHandler.resolve(value)).toEqual(expected)
    })

    it('should use the username from a post page', () => {
      const value = 'https://www.cnblogs.com/example/p/123456.html'
      const expected = [
        {
          uri: 'https://www.cnblogs.com/example/rss',
          hint: { key: 'cnblogs:posts', label: 'Posts' },
        },
      ]

      expect(cnblogsHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(cnblogsHandler.resolve('https://www.cnblogs.com/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(cnblogsHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
