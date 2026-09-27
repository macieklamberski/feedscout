import { describe, expect, it } from 'bun:test'
import { firstoryHandler } from './firstory.js'

describe('firstoryHandler', () => {
  const content =
    '<a href="https://feed.firstory.me/rss/user/ckabcdefgh0123456789klmno" target="_blank">RSS</a>'

  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://open.firstory.me/user/example'],
      [true, 'https://open.firstory.fm/user/example'],
      [true, 'https://open.firstory.fm/story/cmabcdefgh0123456789klmno'],
      [true, 'https://example.firstory.cc/'],
      [true, 'https://example.firstory.cc/episodes/cmabcdefgh0123456789klmno'],
      [false, 'https://firstory.cc/'],
      [false, 'https://firstory.me/'],
      [false, 'https://example.com/user/example'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(firstoryHandler.match(url, content)).toBe(expected)
    })

    it('should return false for page without feed link', () => {
      expect(firstoryHandler.match('https://open.firstory.fm/browse', '<html></html>')).toBe(false)
    })

    it('should return false when no content provided', () => {
      expect(firstoryHandler.match('https://open.firstory.fm/user/example')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL read from the page', () => {
      const value = 'https://open.firstory.fm/user/example'
      const expected = [
        {
          uri: 'https://feed.firstory.me/rss/user/ckabcdefgh0123456789klmno',
          hint: { key: 'firstory:podcast', label: 'Podcast' },
        },
      ]

      expect(firstoryHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return empty array when no content provided', () => {
      expect(firstoryHandler.resolve('https://open.firstory.fm/user/example')).toEqual([])
    })
  })
})
