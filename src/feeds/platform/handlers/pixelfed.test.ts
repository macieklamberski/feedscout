import { describe, expect, it } from 'bun:test'
import { isPixelfedHtml, pixelfedHandler } from './pixelfed.js'

const pixelfedHtml = '<html><head><meta name="generator" content="pixelfed"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'

describe('pixelfedHandler', () => {
  describe('isPixelfedHtml', () => {
    it('should return true for Pixelfed generator meta tag', () => {
      expect(isPixelfedHtml(pixelfedHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isPixelfedHtml('<meta name="generator" content="Pixelfed">')).toBe(true)
      expect(isPixelfedHtml('<meta name="generator" content="PIXELFED">')).toBe(true)
    })

    it('should return false for non-Pixelfed generator', () => {
      expect(isPixelfedHtml(otherHtml)).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for profile URL with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/dansup', pixelfedHtml)).toBe(true)
    })

    it('should return true for /users/{user} URL with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/users/dansup', pixelfedHtml)).toBe(true)
    })

    it('should return false without content', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/dansup')).toBe(false)
    })

    it('should return false for non-Pixelfed content', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/dansup', otherHtml)).toBe(false)
    })

    it('should return false for excluded paths', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/discover', pixelfedHtml)).toBe(false)
      expect(pixelfedHandler.match('https://pixelfed.social/api', pixelfedHtml)).toBe(false)
    })

    it('should return false for non-profile paths', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/p/12345', pixelfedHtml)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(pixelfedHandler.match('not-a-url', pixelfedHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return atom feed for profile', () => {
      const value = 'https://pixelfed.social/dansup'
      const expected = [
        {
          uri: 'https://pixelfed.social/users/dansup.atom',
          hint: { key: 'pixelfed:posts', label: 'Posts' },
        },
      ]

      expect(pixelfedHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for /users/{user} URL', () => {
      const value = 'https://pixelfed.social/users/dansup'
      const expected = [
        {
          uri: 'https://pixelfed.social/users/dansup.atom',
          hint: { key: 'pixelfed:posts', label: 'Posts' },
        },
      ]

      expect(pixelfedHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-profile paths', () => {
      expect(pixelfedHandler.resolve('https://pixelfed.social/p/12345')).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      expect(pixelfedHandler.resolve('https://pixelfed.social/discover')).toEqual([])
    })
  })
})
