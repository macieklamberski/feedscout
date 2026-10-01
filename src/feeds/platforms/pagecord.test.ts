import { describe, expect, it } from 'bun:test'
import { type PagecordUrl, pagecordHandler, parsePagecordUrl } from './pagecord.js'

describe('parsePagecordUrl', () => {
  it('should return the blog for a subdomain', () => {
    const expected: PagecordUrl = { kind: 'blog' }

    expect(parsePagecordUrl('https://example.pagecord.com/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parsePagecordUrl('https://www.pagecord.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePagecordUrl('https://example.com/')).toBeUndefined()
  })
})

describe('pagecordHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.pagecord.com'],
      [true, 'https://blog.example.pagecord.com'],
      [false, 'https://pagecord.com'],
      [false, 'https://www.pagecord.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(pagecordHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(pagecordHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Pagecord', () => {
      expect(pagecordHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.pagecord.com'
      const expected = [
        {
          uri: 'https://alice.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.pagecord.com/some-post-slug'
      const expected = [
        {
          uri: 'https://alice.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })
  })
})
