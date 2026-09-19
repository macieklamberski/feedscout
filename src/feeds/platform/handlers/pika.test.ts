import { describe, expect, it } from 'bun:test'
import { pikaHandler } from './pika.js'

describe('pikaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://pika.pika.page'],
      [true, 'https://blog.example.pika.page'],
      [false, 'https://pika.page'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(pikaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(pikaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return Atom and RSS feeds for blog', () => {
      const value = 'https://pika.pika.page'
      const expected = [
        {
          uri: 'https://pika.pika.page/posts_feed',
          hint: { key: 'pika:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://pika.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts-rss', label: 'Posts (RSS)' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and main feeds for tag page', () => {
      const value = 'https://discardpile.pika.page/tag/tech'
      const expected = [
        {
          uri: 'https://discardpile.pika.page/tag/tech/feed',
          hint: { key: 'pika:tag-atom', label: 'Tag (Atom)' },
        },
        {
          uri: 'https://discardpile.pika.page/tag/tech/feed.rss',
          hint: { key: 'pika:tag-rss', label: 'Tag (RSS)' },
        },
        {
          uri: 'https://discardpile.pika.page/posts_feed',
          hint: { key: 'pika:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://discardpile.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts-rss', label: 'Posts (RSS)' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://pika.pika.page/some-article-slug'
      const expected = [
        {
          uri: 'https://pika.pika.page/posts_feed',
          hint: { key: 'pika:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://pika.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts-rss', label: 'Posts (RSS)' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
