import { describe, expect, it } from 'bun:test'
import { wordpressHandler } from './wordpress.js'

describe('wordpressHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://example.wordpress.com', true],
      ['https://blog.example.wordpress.com', true],
      ['https://wordpress.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(wordpressHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URLs for blog', () => {
      const value = 'https://example.wordpress.com'
      const expected = [
        'https://example.wordpress.com/feed/',
        'https://example.wordpress.com/feed/rss2/',
        'https://example.wordpress.com/feed/rdf/',
        'https://example.wordpress.com/feed/atom/',
        'https://example.wordpress.com/comments/feed/',
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs for post page', () => {
      const value = 'https://blog.wordpress.com/2024/01/01/some-post/'
      const expected = [
        'https://blog.wordpress.com/feed/',
        'https://blog.wordpress.com/feed/rss2/',
        'https://blog.wordpress.com/feed/rdf/',
        'https://blog.wordpress.com/feed/atom/',
        'https://blog.wordpress.com/comments/feed/',
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include category feed when on category page', () => {
      const value = 'https://blog.wordpress.com/category/tech/'
      const expected = [
        'https://blog.wordpress.com/category/tech/feed/',
        'https://blog.wordpress.com/feed/',
        'https://blog.wordpress.com/feed/rss2/',
        'https://blog.wordpress.com/feed/rdf/',
        'https://blog.wordpress.com/feed/atom/',
        'https://blog.wordpress.com/comments/feed/',
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include tag feed when on tag page', () => {
      const value = 'https://blog.wordpress.com/tag/javascript/'
      const expected = [
        'https://blog.wordpress.com/tag/javascript/feed/',
        'https://blog.wordpress.com/feed/',
        'https://blog.wordpress.com/feed/rss2/',
        'https://blog.wordpress.com/feed/rdf/',
        'https://blog.wordpress.com/feed/atom/',
        'https://blog.wordpress.com/comments/feed/',
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })

    it('should include author feed when on author page', () => {
      const value = 'https://blog.wordpress.com/author/johndoe/'
      const expected = [
        'https://blog.wordpress.com/author/johndoe/feed/',
        'https://blog.wordpress.com/feed/',
        'https://blog.wordpress.com/feed/rss2/',
        'https://blog.wordpress.com/feed/rdf/',
        'https://blog.wordpress.com/feed/atom/',
        'https://blog.wordpress.com/comments/feed/',
      ]

      expect(wordpressHandler.resolve(value)).toEqual(expected)
    })
  })
})
