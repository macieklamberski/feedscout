import { describe, expect, it } from 'bun:test'
import { gravHandler, isGravHtml } from './grav.js'

const gravHtml = '<meta name="generator" content="GravCMS" />'
const gravityFormsHtml = '<meta name="generator" content="Gravity Forms 2.9">'

describe('isGravHtml', () => {
  it('should return true for the Grav generator meta tag', () => {
    expect(isGravHtml(gravHtml)).toBe(true)
  })

  it('should return false for Gravity Forms', () => {
    expect(isGravHtml(gravityFormsHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isGravHtml('')).toBe(false)
  })
})

describe('gravHandler', () => {
  describe('match', () => {
    it('should match a Grav page', () => {
      expect(gravHandler.match('https://example.com/blog', gravHtml)).toBe(true)
    })

    it('should not match a page running Gravity Forms', () => {
      expect(gravHandler.match('https://example.com/blog', gravityFormsHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(gravHandler.match('https://example.com/blog')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(gravHandler.match('not-a-url', gravHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the page feeds', () => {
      const value = 'https://example.com/blog'
      const expected = [
        {
          uri: 'https://example.com/blog.rss',
          hint: { key: 'grav:page-rss', label: 'Page (RSS)' },
        },
        {
          uri: 'https://example.com/blog.atom',
          hint: { key: 'grav:page-atom', label: 'Page (Atom)' },
        },
      ]

      expect(gravHandler.resolve(value)).toEqual(expected)
    })

    it('should drop a trailing slash', () => {
      const value = 'https://example.com/blog/'
      const expected = [
        {
          uri: 'https://example.com/blog.rss',
          hint: { key: 'grav:page-rss', label: 'Page (RSS)' },
        },
        {
          uri: 'https://example.com/blog.atom',
          hint: { key: 'grav:page-atom', label: 'Page (Atom)' },
        },
      ]

      expect(gravHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(gravHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
