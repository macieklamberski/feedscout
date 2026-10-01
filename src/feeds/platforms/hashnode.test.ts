import { describe, expect, it } from 'bun:test'
import { type HashnodeUrl, hashnodeHandler, parseHashnodeUrl } from './hashnode.js'

describe('parseHashnodeUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: HashnodeUrl = { kind: 'blog' }

    expect(parseHashnodeUrl('https://jane.hashnode.dev/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseHashnodeUrl('https://example.com/')).toBeUndefined()
  })
})

describe('hashnodeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.hashnode.dev'],
      [true, 'https://blog.example.hashnode.dev'],
      [true, 'https://example.hashnode.com'],
      [false, 'https://hashnode.dev'],
      [false, 'https://hashnode.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hashnodeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hashnodeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Hashnode', () => {
      expect(hashnodeHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://example.hashnode.dev'
      const expected = [
        {
          uri: 'https://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://example.hashnode.dev/some-article-slug'
      const expected = [
        {
          uri: 'https://example.hashnode.dev/rss.xml',
          hint: { key: 'hashnode:blog', label: 'Blog' },
        },
      ]

      expect(hashnodeHandler.resolve(value)).toEqual(expected)
    })
  })
})
