import { describe, expect, it } from 'bun:test'
import { isSvbtleHtml, svbtleHandler } from './svbtle.js'

const svbtleHtml = '<meta name="generator" content="Svbtle.com" />'
const otherHtml = '<meta name="generator" content="Ghost 5.0">'

describe('isSvbtleHtml', () => {
  it('should return true for the Svbtle generator meta tag', () => {
    expect(isSvbtleHtml(svbtleHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isSvbtleHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isSvbtleHtml('')).toBe(false)
  })
})

describe('svbtleHandler', () => {
  describe('match', () => {
    it('should match a blog on its own host', () => {
      expect(svbtleHandler.match('https://example.com/a-post', svbtleHtml)).toBe(true)
    })

    it('should not match the platform host', () => {
      expect(svbtleHandler.match('https://www.svbtle.com/feed', svbtleHtml)).toBe(false)
      expect(svbtleHandler.match('https://svbtle.com/alice', svbtleHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(svbtleHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(svbtleHandler.match('not-a-url', svbtleHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feed', () => {
      const value = 'https://example.com/a-post'
      const expected = [
        { uri: 'https://example.com/feed', hint: { key: 'svbtle:posts', label: 'Posts' } },
      ]

      expect(svbtleHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the platform host', () => {
      expect(svbtleHandler.resolve('https://www.svbtle.com/alice')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(svbtleHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
