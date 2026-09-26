import { describe, expect, it } from 'bun:test'
import { isSnacHtml, snacHandler } from './snac.js'

const snacHtml = '<meta name="generator" content="snac/2.95"/>'
const otherHtml = '<meta name="generator" content="snacks 1.0">'

describe('isSnacHtml', () => {
  it('should return true for the snac generator meta tag', () => {
    expect(isSnacHtml(snacHtml)).toBe(true)
  })

  it('should return false for a value that only starts with the name', () => {
    expect(isSnacHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isSnacHtml('')).toBe(false)
  })
})

describe('snacHandler', () => {
  describe('match', () => {
    it('should match a user page at the origin root', () => {
      expect(snacHandler.match('https://example.org/alice', snacHtml)).toBe(true)
    })

    it('should match a user page under a sub-path', () => {
      expect(snacHandler.match('https://example.org/snac/alice', snacHtml)).toBe(true)
    })

    it('should not match the origin root', () => {
      expect(snacHandler.match('https://example.org/', snacHtml)).toBe(false)
    })

    it('should match a user page by the creator header', () => {
      const value = 'https://example.org/alice'
      const headers = new Headers({ 'x-creator': 'snac/2.95' })

      expect(snacHandler.match(value, '<html></html>', headers)).toBe(true)
    })

    it('should not match another creator header', () => {
      const value = 'https://example.org/alice'
      const headers = new Headers({ 'x-creator': 'snacks/1.0' })

      expect(snacHandler.match(value, '<html></html>', headers)).toBe(false)
    })

    it('should not match without content', () => {
      expect(snacHandler.match('https://example.org/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(snacHandler.match('not-a-url', snacHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should build the feed from the page path, not the origin', () => {
      const value = 'https://example.org/snac/alice'
      const expected = [
        { uri: 'https://example.org/snac/alice.rss', hint: { key: 'snac:posts', label: 'Posts' } },
      ]

      expect(snacHandler.resolve(value)).toEqual(expected)
    })

    it('should drop a trailing slash', () => {
      const value = 'https://example.org/snac/alice/'
      const expected = [
        { uri: 'https://example.org/snac/alice.rss', hint: { key: 'snac:posts', label: 'Posts' } },
      ]

      expect(snacHandler.resolve(value)).toEqual(expected)
    })

    it('should build the user feed from a post page', () => {
      const value = 'https://example.org/social/alice/p/1790085034.546035'
      const expected = [
        {
          uri: 'https://example.org/social/alice.rss',
          hint: { key: 'snac:posts', label: 'Posts' },
        },
      ]

      expect(snacHandler.resolve(value)).toEqual(expected)
    })

    it('should build the user feed from a post page with a capitalized p segment', () => {
      const value = 'https://example.org/social/alice/P/1790085034.546035'
      const expected = [
        {
          uri: 'https://example.org/social/alice.rss',
          hint: { key: 'snac:posts', label: 'Posts' },
        },
      ]

      expect(snacHandler.resolve(value)).toEqual(expected)
    })

    it('should build the user feed from a history page', () => {
      const value = 'https://example.org/alice/h/2026-05.html'
      const expected = [
        {
          uri: 'https://example.org/alice.rss',
          hint: { key: 'snac:posts', label: 'Posts' },
        },
      ]

      expect(snacHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the origin root', () => {
      expect(snacHandler.resolve('https://example.org/')).toEqual([])
    })
  })
})
