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

    it('should return an empty array for the origin root', () => {
      expect(snacHandler.resolve('https://example.org/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(snacHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
