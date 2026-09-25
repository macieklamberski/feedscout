import { describe, expect, it } from 'bun:test'
import type { BookwyrmUrl } from './bookwyrm.js'
import { bookwyrmHandler, isBookwyrmHtml, parseBookwyrmUrl } from './bookwyrm.js'

const bookwyrmHtml = '<html><head><meta name="generator" content="BookWyrm"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'

describe('parseBookwyrmUrl', () => {
  it('should return the profile for a profile page', () => {
    const expected: BookwyrmUrl = { kind: 'profile', username: 'mouse' }

    expect(parseBookwyrmUrl('https://bookwyrm.social/user/mouse')).toEqual(expected)
  })

  it('should return the profile of a remote user', () => {
    const value = 'https://books.example.com/user/reader@remote.example.org'
    const expected: BookwyrmUrl = { kind: 'profile', username: 'reader@remote.example.org' }

    expect(parseBookwyrmUrl(value)).toEqual(expected)
  })

  it('should return the shelf for /user/{user}/books/{shelf}', () => {
    const value = 'https://bookwyrm.social/user/mouse/books/read'
    const expected: BookwyrmUrl = {
      kind: 'shelf',
      username: 'mouse',
      section: 'books',
      shelf: 'read',
    }

    expect(parseBookwyrmUrl(value)).toEqual(expected)
  })

  it('should return the shelf for /user/{user}/shelf/{shelf}', () => {
    const value = 'https://bookwyrm.social/user/mouse/shelf/to-read'
    const expected: BookwyrmUrl = {
      kind: 'shelf',
      username: 'mouse',
      section: 'shelf',
      shelf: 'to-read',
    }

    expect(parseBookwyrmUrl(value)).toEqual(expected)
  })

  it('should return the shelf of a remote user', () => {
    const value = 'https://books.example.com/user/reader@remote.example.org/shelf/read'
    const expected: BookwyrmUrl = {
      kind: 'shelf',
      username: 'reader@remote.example.org',
      section: 'shelf',
      shelf: 'read',
    }

    expect(parseBookwyrmUrl(value)).toEqual(expected)
  })

  it('should return a subpage for the all-books page', () => {
    const expected: BookwyrmUrl = { kind: 'subpage', username: 'reader' }

    expect(parseBookwyrmUrl('https://books.example.com/user/reader/books')).toEqual(expected)
  })

  it('should return a subpage for other user pages', () => {
    const expected: BookwyrmUrl = { kind: 'subpage', username: 'reader' }

    expect(parseBookwyrmUrl('https://books.example.com/user/reader/followers')).toEqual(expected)
    expect(parseBookwyrmUrl('https://books.example.com/user/reader/reviews')).toEqual(expected)
  })

  it('should return undefined for the user prefix without a name', () => {
    expect(parseBookwyrmUrl('https://books.example.com/user')).toBeUndefined()
  })

  it('should return undefined for non-user paths', () => {
    expect(parseBookwyrmUrl('https://bookwyrm.social/about')).toBeUndefined()
    expect(parseBookwyrmUrl('https://books.example.com/book/123')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseBookwyrmUrl('not-a-url')).toBeUndefined()
  })
})

describe('bookwyrmHandler', () => {
  describe('isBookwyrmHtml', () => {
    it('should return true for BookWyrm generator meta tag', () => {
      expect(isBookwyrmHtml(bookwyrmHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isBookwyrmHtml('<meta name="generator" content="bookwyrm">')).toBe(true)
      expect(isBookwyrmHtml('<meta name="generator" content="BOOKWYRM">')).toBe(true)
    })

    it('should return true for the footer source link without a generator meta', () => {
      const value = '<a href="https://github.com/bookwyrm-social/bookwyrm">Source code</a>'

      expect(isBookwyrmHtml(value)).toBe(true)
    })

    it('should return false for a link to another project in the same organisation', () => {
      const value = '<a href="https://github.com/bookwyrm-social/bookwyrm-docs">Docs</a>'

      expect(isBookwyrmHtml(value)).toBe(false)
    })

    it('should return false for non-BookWyrm generator', () => {
      expect(isBookwyrmHtml(otherHtml)).toBe(false)
    })

    it('should return false for empty content', () => {
      expect(isBookwyrmHtml('')).toBe(false)
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
  })

  describe('resolve', () => {
    it('should return activity, reviews, quotes, and comments feeds for profile', () => {
      const value = 'https://bookwyrm.social/user/mouse'
      const expected = [
        {
          uri: 'https://bookwyrm.social/user/mouse/rss',
          hint: { key: 'bookwyrm:activity', label: 'Activity' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-reviews',
          hint: { key: 'bookwyrm:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-quotes',
          hint: { key: 'bookwyrm:quotes', label: 'Quotes' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-comments',
          hint: { key: 'bookwyrm:comments', label: 'Comments' },
        },
      ]

      expect(bookwyrmHandler.resolve(value)).toEqual(expected)
    })

    it('should return all four feeds for a user subpage', () => {
      const value = 'https://bookwyrm.social/user/mouse/books'
      const expected = [
        {
          uri: 'https://bookwyrm.social/user/mouse/rss',
          hint: { key: 'bookwyrm:activity', label: 'Activity' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-reviews',
          hint: { key: 'bookwyrm:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-quotes',
          hint: { key: 'bookwyrm:quotes', label: 'Quotes' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-comments',
          hint: { key: 'bookwyrm:comments', label: 'Comments' },
        },
      ]

      expect(bookwyrmHandler.resolve(value)).toEqual(expected)
    })

    it('should prepend shelf feed for /user/{user}/books/{shelf}', () => {
      const value = 'https://bookwyrm.social/user/mouse/books/read'
      const expected = [
        {
          uri: 'https://bookwyrm.social/user/mouse/books/read/rss',
          hint: { key: 'bookwyrm:shelf', label: 'Shelf' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss',
          hint: { key: 'bookwyrm:activity', label: 'Activity' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-reviews',
          hint: { key: 'bookwyrm:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-quotes',
          hint: { key: 'bookwyrm:quotes', label: 'Quotes' },
        },
        {
          uri: 'https://bookwyrm.social/user/mouse/rss-comments',
          hint: { key: 'bookwyrm:comments', label: 'Comments' },
        },
      ]

      expect(bookwyrmHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a page outside a user', () => {
      expect(bookwyrmHandler.resolve('https://books.example.com/about')).toEqual([])
    })
  })
})
