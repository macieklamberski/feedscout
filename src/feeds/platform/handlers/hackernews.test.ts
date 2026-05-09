import { describe, expect, it } from 'bun:test'
import { hackernewsHandler } from './hackernews.js'

describe('hackernewsHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://news.ycombinator.com', true],
      ['https://news.ycombinator.com/news', true],
      ['https://news.ycombinator.com/item?id=12345', true],
      ['https://ycombinator.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(hackernewsHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hackernewsHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return front page feed for root', () => {
      const value = 'https://news.ycombinator.com'
      const expected = [
        {
          uri: 'https://news.ycombinator.com/rss',
          hint: { key: 'hackernews:front', label: 'Front page' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })

    it('should return front page feed for any non-show path', () => {
      const value = 'https://news.ycombinator.com/item?id=12345'
      const expected = [
        {
          uri: 'https://news.ycombinator.com/rss',
          hint: { key: 'hackernews:front', label: 'Front page' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })

    it('should return Show HN feed for /show', () => {
      const value = 'https://news.ycombinator.com/show'
      const expected = [
        {
          uri: 'https://news.ycombinator.com/showrss',
          hint: { key: 'hackernews:show', label: 'Show HN' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })

    it('should return Show HN feed for /shownew', () => {
      const value = 'https://news.ycombinator.com/shownew'
      const expected = [
        {
          uri: 'https://news.ycombinator.com/showrss',
          hint: { key: 'hackernews:show', label: 'Show HN' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })
  })
})
