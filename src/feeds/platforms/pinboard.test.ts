import { describe, expect, it } from 'bun:test'
import { pinboardHandler } from './pinboard.js'

describe('pinboardHandler', () => {
  describe('match', () => {
    it('should match a Pinboard URL', () => {
      expect(pinboardHandler.match('https://pinboard.in/u:example/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(pinboardHandler.match('https://example.com/u:example/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the bookmarks feed for a user page', () => {
      const value = 'https://pinboard.in/u:example/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the username case', () => {
      const value = 'https://pinboard.in/U:Example/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:Example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the bookmarks feed for a user subpage', () => {
      const value = 'https://pinboard.in/u:example/before:12345'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a user tag page', () => {
      const value = 'https://pinboard.in/u:example/t:Programming/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/t:Programming/',
          hint: { key: 'pinboard:tag', label: 'Tag' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a user page with several tags', () => {
      const value = 'https://pinboard.in/u:example/T:programming/t:rust'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/t:programming/t:rust/',
          hint: { key: 'pinboard:tag', label: 'Tag' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the recent feed for the recent page', () => {
      const value = 'https://pinboard.in/recent/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/recent/',
          hint: { key: 'pinboard:recent', label: 'Recent' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the popular feed for the popular page', () => {
      const value = 'https://pinboard.in/popular/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/popular/',
          hint: { key: 'pinboard:popular', label: 'Popular' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a site-wide tag page', () => {
      const value = 'https://pinboard.in/t:programming/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/t:programming/',
          hint: { key: 'pinboard:tag', label: 'Tag' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the popular feed for the homepage', () => {
      const value = 'https://pinboard.in/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/popular/',
          hint: { key: 'pinboard:popular', label: 'Popular' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })
  })
})
