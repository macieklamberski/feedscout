import { describe, expect, it } from 'bun:test'
import { pagecordHandler } from './pagecord.js'

describe('pagecordHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://unfiltered.pagecord.com', true],
      ['https://blog.example.pagecord.com', true],
      ['https://pagecord.com', false],
      ['https://www.pagecord.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(pagecordHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(pagecordHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://unfiltered.pagecord.com'
      const expected = [
        {
          uri: 'https://unfiltered.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://unfiltered.pagecord.com/some-post-slug'
      const expected = [
        {
          uri: 'https://unfiltered.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })
  })
})
