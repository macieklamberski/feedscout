import { describe, expect, it } from 'bun:test'
import { isTextpatternHtml, textpatternHandler } from './textpattern.js'

const textpatternHtml = '<meta name="generator" content="Textpattern CMS">'
const otherHtml = '<meta name="generator" content="WordPress 6.4">'

describe('isTextpatternHtml', () => {
  it('should return true for the Textpattern generator meta tag', () => {
    expect(isTextpatternHtml(textpatternHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isTextpatternHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isTextpatternHtml('')).toBe(false)
  })
})

describe('textpatternHandler', () => {
  describe('match', () => {
    it('should match a Textpattern page', () => {
      expect(textpatternHandler.match('https://example.com/article/1', textpatternHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(textpatternHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match another platform', () => {
      expect(textpatternHandler.match('https://example.com/', otherHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(textpatternHandler.match('not-a-url', textpatternHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the RSS and Atom feeds', () => {
      const value = 'https://example.com/article/1'
      const expected = [
        {
          uri: 'https://example.com/rss',
          hint: { key: 'textpattern:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://example.com/atom',
          hint: { key: 'textpattern:posts-atom', label: 'Posts (Atom)' },
        },
      ]

      expect(textpatternHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(textpatternHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
