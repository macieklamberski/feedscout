import { describe, expect, it } from 'bun:test'
import { type HackernewsUrl, hackernewsHandler, parseHackernewsUrl } from './hackernews.js'

describe('parseHackernewsUrl', () => {
  it('should return the show page', () => {
    const expected: HackernewsUrl = { kind: 'show' }

    expect(parseHackernewsUrl('https://news.ycombinator.com/show')).toEqual(expected)
  })

  it('should return the home page for any other page', () => {
    const expected: HackernewsUrl = { kind: 'home' }

    expect(parseHackernewsUrl('https://news.ycombinator.com/item?id=1')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseHackernewsUrl('https://example.com/')).toBeUndefined()
  })
})

describe('hackernewsHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://news.ycombinator.com'],
      [true, 'https://news.ycombinator.com/news'],
      [true, 'https://news.ycombinator.com/item?id=12345'],
      [false, 'https://ycombinator.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hackernewsHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hackernewsHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Hacker News', () => {
      expect(hackernewsHandler.resolve('https://example.com/')).toEqual([])
    })

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

    const showValues: Array<string> = [
      'https://news.ycombinator.com/show',
      'https://news.ycombinator.com/show/',
      'https://news.ycombinator.com/shownew',
      'https://news.ycombinator.com/shownew/',
    ]

    it.each(showValues)('should return Show HN feed for %s', (value) => {
      const expected = [
        {
          uri: 'https://news.ycombinator.com/showrss',
          hint: { key: 'hackernews:show', label: 'Show HN' },
        },
      ]

      expect(hackernewsHandler.resolve(value)).toEqual(expected)
    })

    it('should return Show HN feed for /show with a capitalized show segment', () => {
      const value = 'https://news.ycombinator.com/Show'
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
