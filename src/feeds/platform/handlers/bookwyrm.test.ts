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
    it('should return rss feed for profile', () => {
      const value = 'https://bookwyrm.social/user/mouse'
      const expected = [
        {
          uri: 'https://bookwyrm.social/user/mouse/rss',
          hint: { key: 'bookwyrm:reviews', label: 'Reviews' },
        },
      ]

      expect(bookwyrmHandler.resolve(value)).toEqual(expected)
    })

    it('should return rss feed regardless of subpath', () => {
      const value = 'https://bookwyrm.social/user/mouse/books'
      const expected = [
        {
          uri: 'https://bookwyrm.social/user/mouse/rss',
          hint: { key: 'bookwyrm:reviews', label: 'Reviews' },
        },
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
