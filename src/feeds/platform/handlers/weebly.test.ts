import { describe, expect, it } from 'bun:test'
import { weeblyHandler } from './weebly.js'

describe('weeblyHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.weebly.com', true],
      ['https://blog.example.weebly.com', true],
      ['https://weebly.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(weeblyHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(weeblyHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return default feed for blog root', () => {
      const value = 'https://example.weebly.com'
      const expected = [
        {
          uri: 'https://example.weebly.com/1/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })

    it('should return custom slug and default feeds for named blog page', () => {
      const value = 'https://example.weebly.com/blog'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.weebly.com/1/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })

    it('should skip custom slug for numeric segments', () => {
      const value = 'https://example.weebly.com/1/feed'
      const expected = [
        {
          uri: 'https://example.weebly.com/1/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })
  })
})
