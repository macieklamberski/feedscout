import { describe, expect, it } from 'bun:test'
import { tumblrHandler } from './tumblr.js'

describe('tumblrHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.tumblr.com', true],
      ['https://blog.example.tumblr.com', true],
      ['https://tumblr.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(tumblrHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://example.tumblr.com'
      const expected = [
        { uri: 'https://example.tumblr.com/rss', hint: { key: 'tumblr:posts', label: 'Posts' } },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://blog.tumblr.com/post/123456/some-post'
      const expected = [
        { uri: 'https://blog.tumblr.com/rss', hint: { key: 'tumblr:posts', label: 'Posts' } },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })

    it('should return tagged feed URL for tag page', () => {
      const value = 'https://example.tumblr.com/tagged/photography'
      const expected = [
        {
          uri: 'https://example.tumblr.com/tagged/photography/rss',
          hint: { key: 'tumblr:tag', label: 'Tag' },
        },
      ]

      expect(tumblrHandler.resolve(value)).toEqual(expected)
    })
  })
})
