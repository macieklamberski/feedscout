import { describe, expect, it } from 'bun:test'
import { isWritefreelyHtml, writefreelyHandler } from './writefreely.js'

const writefreelyHtml = '<meta name="generator" content="WriteFreely">'
const otherHtml = '<meta name="generator" content="Ghost 5.0">'

describe('isWritefreelyHtml', () => {
  it('should return true for the WriteFreely generator meta tag', () => {
    expect(isWritefreelyHtml(writefreelyHtml)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isWritefreelyHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isWritefreelyHtml('')).toBe(false)
  })
})

describe('writefreelyHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(writefreelyHandler.match('https://example.org/alice', writefreelyHtml)).toBe(true)
    })

    it('should not match the instance root', () => {
      expect(writefreelyHandler.match('https://example.org/', writefreelyHtml)).toBe(false)
    })

    it('should not match the reader path', () => {
      expect(writefreelyHandler.match('https://example.org/read', writefreelyHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(writefreelyHandler.match('https://example.org/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(writefreelyHandler.match('not-a-url', writefreelyHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog and reader feeds', () => {
      const value = 'https://example.org/alice'
      const expected = [
        {
          uri: 'https://example.org/alice/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.org/read/feed/',
          hint: { key: 'writefreely:reader', label: 'Reader' },
        },
      ]

      expect(writefreelyHandler.resolve(value)).toEqual(expected)
    })

    it('should use the blog name from a post page', () => {
      const value = 'https://example.org/alice/a-post'
      const expected = [
        {
          uri: 'https://example.org/alice/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.org/read/feed/',
          hint: { key: 'writefreely:reader', label: 'Reader' },
        },
      ]

      expect(writefreelyHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the instance root', () => {
      expect(writefreelyHandler.resolve('https://example.org/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(writefreelyHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
