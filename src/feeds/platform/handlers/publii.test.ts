import { describe, expect, it } from 'bun:test'
import { isPubliiHtml, publiiHandler } from './publii.js'

const publiiHtml = '<meta name="generator" content="Publii Open-Source CMS for Static Site">'
const otherHtml = '<meta name="generator" content="Hugo 0.120">'

describe('isPubliiHtml', () => {
  it('should return true for the Publii generator meta tag', () => {
    expect(isPubliiHtml(publiiHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isPubliiHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPubliiHtml('')).toBe(false)
  })
})

describe('publiiHandler', () => {
  describe('match', () => {
    it('should match a Publii page', () => {
      expect(publiiHandler.match('https://example.com/posts/a-post', publiiHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(publiiHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match another platform', () => {
      expect(publiiHandler.match('https://example.com/', otherHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(publiiHandler.match('not-a-url', publiiHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the Atom and JSON feeds', () => {
      const value = 'https://example.com/posts/a-post'
      const expected = [
        { uri: 'https://example.com/feed.xml', hint: { key: 'publii:posts', label: 'Posts' } },
        {
          uri: 'https://example.com/feed.json',
          hint: { key: 'publii:posts-json', label: 'Posts (JSON)' },
        },
      ]

      expect(publiiHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(publiiHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
