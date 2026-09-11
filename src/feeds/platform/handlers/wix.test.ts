import { describe, expect, it } from 'bun:test'
import { isWixHtml, wixHandler } from './wix.js'

const wixHtml = '<meta name="generator" content="Wix.com Website Builder"/>'
const otherHtml = '<meta name="generator" content="Squarespace">'

describe('isWixHtml', () => {
  it('should return true for the Wix generator meta tag', () => {
    expect(isWixHtml(wixHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isWixHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isWixHtml('')).toBe(false)
  })
})

describe('wixHandler', () => {
  describe('match', () => {
    it('should match a Wix page', () => {
      expect(wixHandler.match('https://example.com/post/a-post', wixHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(wixHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match another platform', () => {
      expect(wixHandler.match('https://example.com/', otherHtml)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(wixHandler.match('not-a-url', wixHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog feed at the site root', () => {
      const value = 'https://example.com/post/a-post'
      const expected = [
        { uri: 'https://example.com/blog-feed.xml', hint: { key: 'wix:blog', label: 'Blog' } },
      ]

      expect(wixHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(wixHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
