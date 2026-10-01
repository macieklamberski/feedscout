import { describe, expect, it } from 'bun:test'
import { type MataroaUrl, mataroaHandler, parseMataroaUrl } from './mataroa.js'

describe('parseMataroaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: MataroaUrl = { kind: 'blog' }

    expect(parseMataroaUrl('https://jane.mataroa.blog/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseMataroaUrl('https://example.com/')).toBeUndefined()
  })
})

describe('mataroaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.mataroa.blog'],
      [true, 'https://blog.example.mataroa.blog'],
      [false, 'https://mataroa.blog'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(mataroaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(mataroaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Mataroa', () => {
      expect(mataroaHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.mataroa.blog'
      const expected = [
        {
          uri: 'https://alice.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.mataroa.blog/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })
  })
})
