import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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
    it('should return the tag feed for a capitalized tag segment', () => {
      const value = 'https://discardpile.pika.page/Tag/tech'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://discardpile.pika.page/tag/tech/feed',
          hint: { key: 'pika:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://discardpile.pika.page/tag/tech/feed.rss',
          hint: { key: 'pika:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://discardpile.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://discardpile.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return Atom and RSS feeds for blog', () => {
      const value = 'https://pika.pika.page'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://pika.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://pika.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and main feeds for tag page', () => {
      const value = 'https://discardpile.pika.page/tag/tech'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://discardpile.pika.page/tag/tech/feed',
          hint: { key: 'pika:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://discardpile.pika.page/tag/tech/feed.rss',
          hint: { key: 'pika:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://discardpile.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://discardpile.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://pika.pika.page/some-article-slug'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://pika.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://pika.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })
  })
})
