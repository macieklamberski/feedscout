import { describe, expect, it } from 'bun:test'
import { togetterHandler } from './togetter.js'

describe('togetterHandler', () => {
  describe('match', () => {
    it('should match a Togetter URL', () => {
      expect(togetterHandler.match('https://togetter.com/id/example')).toBe(true)
      expect(togetterHandler.match('https://togetter.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(togetterHandler.match('https://example.com/id/example')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(togetterHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the curator and popular feeds for a curator page', () => {
      const value = 'https://togetter.com/id/example'
      const expected = [
        {
          uri: 'https://togetter.com/rss/id/example',
          hint: { key: 'togetter:curator', label: 'Curator' },
        },
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the popular feed elsewhere', () => {
      const value = 'https://togetter.com/li/123456'
      const expected = [
        { uri: 'https://togetter.com/rss/hot', hint: { key: 'togetter:hot', label: 'Popular' } },
      ]

      expect(togetterHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(togetterHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
