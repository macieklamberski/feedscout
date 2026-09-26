import { describe, expect, it } from 'bun:test'
import type { PixelfedUrl } from './pixelfed.js'
import { isPixelfedHtml, parsePixelfedUrl, pixelfedHandler } from './pixelfed.js'

const pixelfedHtml = '<html><head><meta name="generator" content="pixelfed"></head></html>'
const otherHtml = '<html><head><meta name="generator" content="WordPress"></head></html>'

describe('parsePixelfedUrl', () => {
  it('should return the username for a profile page', () => {
    const expected: PixelfedUrl = { kind: 'user', username: 'dansup' }

    expect(parsePixelfedUrl('https://pixelfed.social/dansup')).toEqual(expected)
  })

  it('should return the username for a trailing slash', () => {
    const expected: PixelfedUrl = { kind: 'user', username: 'dansup' }

    expect(parsePixelfedUrl('https://pixelfed.social/dansup/')).toEqual(expected)
  })

  it('should return the username for a /users/{user} URL', () => {
    const expected: PixelfedUrl = { kind: 'user', username: 'dansup' }

    expect(parsePixelfedUrl('https://pixelfed.social/users/dansup')).toEqual(expected)
  })

  it('should return the username for a /users/{user} URL with a capitalized users segment', () => {
    const expected: PixelfedUrl = { kind: 'user', username: 'dansup' }

    expect(parsePixelfedUrl('https://pixelfed.social/Users/dansup')).toEqual(expected)
  })

  it('should return undefined for excluded paths', () => {
    expect(parsePixelfedUrl('https://pixelfed.social/discover')).toBeUndefined()
    expect(parsePixelfedUrl('https://pixelfed.social/api')).toBeUndefined()
    expect(parsePixelfedUrl('https://pixelfed.social/settings')).toBeUndefined()
  })

  it('should return undefined for excluded paths in any case', () => {
    expect(parsePixelfedUrl('https://pixelfed.social/Discover')).toBeUndefined()
  })

  it('should return undefined for non-profile paths', () => {
    expect(parsePixelfedUrl('https://pixelfed.social/p/12345')).toBeUndefined()
    expect(parsePixelfedUrl('https://pixelfed.social/p/dansup/123')).toBeUndefined()
  })

  it('should return undefined for a name with characters outside the username set', () => {
    expect(parsePixelfedUrl('https://pixelfed.social/dan-sup')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parsePixelfedUrl('https://pixelfed.social/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePixelfedUrl('not-a-url')).toBeUndefined()
  })
})

describe('pixelfedHandler', () => {
  describe('isPixelfedHtml', () => {
    it('should return true for Pixelfed generator meta tag', () => {
      expect(isPixelfedHtml(pixelfedHtml)).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isPixelfedHtml('<meta name="generator" content="Pixelfed">')).toBe(true)
      expect(isPixelfedHtml('<meta name="generator" content="PIXELFED">')).toBe(true)
    })

    it('should return true for Pixelfed application-name meta tag without generator', () => {
      expect(isPixelfedHtml('<meta name="application-name" content="Pixelfed">')).toBe(true)
    })

    it('should return false for non-Pixelfed generator', () => {
      expect(isPixelfedHtml(otherHtml)).toBe(false)
    })

    it('should return false for empty content', () => {
      expect(isPixelfedHtml('')).toBe(false)
    })
  })

  describe('match', () => {
    it('should return true for profile URL with Pixelfed content', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/dansup', pixelfedHtml)).toBe(true)
    })

    it('should return false without content', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/dansup')).toBe(false)
    })

    it('should return false for non-Pixelfed content', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/dansup', otherHtml)).toBe(false)
    })

    it('should return false for non-profile paths', () => {
      expect(pixelfedHandler.match('https://pixelfed.social/p/12345', pixelfedHtml)).toBe(false)
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

    it('should return empty array for non-profile paths', () => {
      expect(pixelfedHandler.resolve('https://pixelfed.social/p/12345')).toEqual([])
    })
  })
})
