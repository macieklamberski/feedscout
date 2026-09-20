import { describe, expect, it } from 'bun:test'
import { isSquarespaceHeaders, squarespaceHandler } from './squarespace.js'

const squarespaceHeaders = new Headers({ server: 'Squarespace' })

describe('isSquarespaceHeaders', () => {
  it('should return true for the Squarespace server header', () => {
    expect(isSquarespaceHeaders(squarespaceHeaders)).toBe(true)
  })

  it('should return true case-insensitively', () => {
    expect(isSquarespaceHeaders(new Headers({ server: 'squarespace' }))).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isSquarespaceHeaders(new Headers())).toBe(false)
    expect(isSquarespaceHeaders(new Headers({ server: 'nginx' }))).toBe(false)
  })
})

describe('squarespaceHandler', () => {
  describe('match', () => {
    it('should match a collection path', () => {
      const value = 'https://example.com/blog'

      expect(squarespaceHandler.match(value, '', squarespaceHeaders)).toBe(true)
    })

    it('should match a collection path under any slug', () => {
      const value = 'https://example.com/journal/a-post'

      expect(squarespaceHandler.match(value, '', squarespaceHeaders)).toBe(true)
    })

    it('should not match the site root', () => {
      expect(squarespaceHandler.match('https://example.com/', '', squarespaceHeaders)).toBe(false)
    })

    it('should not match reserved paths', () => {
      expect(squarespaceHandler.match('https://example.com/config', '', squarespaceHeaders)).toBe(
        false,
      )
    })

    it('should not match without the header', () => {
      expect(squarespaceHandler.match('https://example.com/blog')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(squarespaceHandler.match('not-a-url', '', squarespaceHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the collection feed', () => {
      const value = 'https://example.com/blog'
      const expected = [
        {
          uri: 'https://example.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should use the first path segment of a deeper page', () => {
      const value = 'https://example.com/news/a-post'
      const expected = [
        {
          uri: 'https://example.com/news?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(squarespaceHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(squarespaceHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
