import { describe, expect, it } from 'bun:test'
import { paragraphHandler } from './paragraph.js'

describe('paragraphHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://paragraph.com/@blog', true],
      ['https://www.paragraph.com/@user', true],
      ['https://paragraph.com/', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(paragraphHandler.match(url)).toBe(expected)
    })

    it('should throw for invalid URL', () => {
      expect(() => paragraphHandler.match('not-a-url')).toThrow()
    })
  })

  describe('resolve', () => {
    it('should return feed URLs for user blog', () => {
      const value = 'https://paragraph.com/@blog'
      const expected = [
        {
          uri: ['https://paragraph.com/@blog/feed', 'https://paragraph.com/@blog/rss'],
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of subpath', () => {
      const value = 'https://paragraph.com/@optimism/some-post-slug'
      const expected = [
        {
          uri: ['https://paragraph.com/@optimism/feed', 'https://paragraph.com/@optimism/rss'],
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for www subdomain', () => {
      const value = 'https://www.paragraph.com/@user'
      const expected = [
        {
          uri: ['https://paragraph.com/@user/feed', 'https://paragraph.com/@user/rss'],
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://paragraph.com/'

      expect(paragraphHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for paths without @ prefix', () => {
      const value = 'https://paragraph.com/about'

      expect(paragraphHandler.resolve(value)).toEqual([])
    })
  })
})
