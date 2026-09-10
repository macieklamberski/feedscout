import { describe, expect, it } from 'bun:test'
import { pikaHandler } from './pika.js'

describe('pikaHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://pika.pika.page', true],
      ['https://blog.example.pika.page', true],
      ['https://pika.page', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
