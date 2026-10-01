import { describe, expect, it } from 'bun:test'
import { parseTistoryUrl, type TistoryUrl, tistoryHandler } from './tistory.js'

describe('parseTistoryUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: TistoryUrl = { kind: 'blog' }

    expect(parseTistoryUrl('https://example.tistory.com/')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseTistoryUrl('https://tistory.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTistoryUrl('https://example.com/')).toBeUndefined()
  })
})

describe('tistoryHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.tistory.com'],
      [true, 'https://blog.example.tistory.com'],
      [false, 'https://tistory.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(tistoryHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(tistoryHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Tistory', () => {
      expect(tistoryHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.tistory.com'
      const expected = [
        {
          uri: 'https://alice.tistory.com/rss',
          hint: { key: 'tistory:blog', label: 'Blog' },
        },
      ]

      expect(tistoryHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.tistory.com/123'
      const expected = [
        {
          uri: 'https://alice.tistory.com/rss',
          hint: { key: 'tistory:blog', label: 'Blog' },
        },
      ]

      expect(tistoryHandler.resolve(value)).toEqual(expected)
    })
  })
})
