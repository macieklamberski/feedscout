import { describe, expect, it } from 'bun:test'
import { isShaarliHtml, shaarliHandler } from './shaarli.js'

const shaarliHtml = '<div id="shaarli-menu" class="pure-menu"></div>'
const otherHtml = '<div id="menu"></div>'

describe('isShaarliHtml', () => {
  it('should return true for the Shaarli menu id', () => {
    expect(isShaarliHtml(shaarliHtml)).toBe(true)
  })

  it('should return false for another bookmark manager', () => {
    expect(isShaarliHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isShaarliHtml('')).toBe(false)
  })
})

describe('shaarliHandler', () => {
  describe('match', () => {
    it('should match a Shaarli page', () => {
      expect(shaarliHandler.match('https://example.org/', shaarliHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(shaarliHandler.match('https://example.org/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(shaarliHandler.match('not-a-url', shaarliHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the current and legacy feed shapes', () => {
      const value = 'https://example.org/'
      const expected = [
        {
          uri: 'https://example.org/feed/rss',
          hint: { key: 'shaarli:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://example.org/feed/atom',
          hint: { key: 'shaarli:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://example.org/?do=rss',
          hint: { key: 'shaarli:posts-legacy', label: 'Posts (legacy)' },
        },
      ]

      expect(shaarliHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(shaarliHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
