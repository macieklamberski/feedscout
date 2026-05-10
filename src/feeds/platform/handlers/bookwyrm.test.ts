import { describe, expect, it } from 'bun:test'
import { bookwyrmHandler, isBookwyrmHtml } from './bookwyrm.js'

const bookwyrmHtml = '<html><head><meta name="generator" content="BookWyrm"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'

describe('bookwyrmHandler', () => {
  describe('isBookwyrmHtml', () => {
    it('should return true for BookWyrm generator meta tag', () => {
      expect(isBookwyrmHtml(bookwyrmHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isBookwyrmHtml('<meta name="generator" content="bookwyrm">')).toBe(true)
      expect(isBookwyrmHtml('<meta name="generator" content="BOOKWYRM">')).toBe(true)
    })

    it('should return false for non-BookWyrm generator', () => {
      expect(isBookwyrmHtml(otherHtml)).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for profile URL with BookWyrm content', () => {
      expect(bookwyrmHandler.match('https://bookwyrm.social/user/mouse', bookwyrmHtml)).toBe(true)
    })

    it('should return false without content', () => {
      expect(bookwyrmHandler.match('https://bookwyrm.social/user/mouse')).toBe(false)
    })

    it('should return false for non-BookWyrm content', () => {
      expect(bookwyrmHandler.match('https://bookwyrm.social/user/mouse', otherHtml)).toBe(false)
    })

    it('should return false for non-user paths', () => {
      expect(bookwyrmHandler.match('https://bookwyrm.social/about', bookwyrmHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(bookwyrmHandler.match('not-a-url', bookwyrmHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    const baseFeeds = (user: string) => [
      {
        uri: `https://bookwyrm.social/user/${user}/rss`,
        hint: { key: 'bookwyrm:activity', label: 'Activity' },
      },
      {
        uri: `https://bookwyrm.social/user/${user}/rss-reviews`,
        hint: { key: 'bookwyrm:reviews', label: 'Reviews' },
      },
      {
        uri: `https://bookwyrm.social/user/${user}/rss-quotes`,
        hint: { key: 'bookwyrm:quotes', label: 'Quotes' },
      },
      {
        uri: `https://bookwyrm.social/user/${user}/rss-comments`,
        hint: { key: 'bookwyrm:comments', label: 'Comments' },
      },
    ]

    it('should return activity, reviews, quotes, and comments feeds for profile', () => {
      const value = 'https://bookwyrm.social/user/mouse'

      expect(bookwyrmHandler.resolve(value)).toEqual(baseFeeds('mouse'))
    })

    it('should return all four feeds regardless of subpath', () => {
      const value = 'https://bookwyrm.social/user/mouse/books'

      expect(bookwyrmHandler.resolve(value)).toEqual(baseFeeds('mouse'))
    })

    it('should prepend shelf feed for /user/{user}/books/{shelf}', () => {
      const value = 'https://bookwyrm.social/user/mouse/books/read'
      const expected = [
        {
          uri: 'https://bookwyrm.social/user/mouse/books/read/rss',
          hint: { key: 'bookwyrm:shelf', label: 'Shelf' },
        },
        ...baseFeeds('mouse'),
      ]

      expect(bookwyrmHandler.resolve(value)).toEqual(expected)
    })

    it('should prepend shelf feed for /user/{user}/shelf/{shelf}', () => {
      const value = 'https://bookwyrm.social/user/mouse/shelf/to-read'
      const expected = [
        {
          uri: 'https://bookwyrm.social/user/mouse/shelf/to-read/rss',
          hint: { key: 'bookwyrm:shelf', label: 'Shelf' },
        },
        ...baseFeeds('mouse'),
      ]

      expect(bookwyrmHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-user paths', () => {
      expect(bookwyrmHandler.resolve('https://bookwyrm.social/about')).toEqual([])
    })

    it('should return empty array for invalid URL', () => {
      expect(bookwyrmHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
