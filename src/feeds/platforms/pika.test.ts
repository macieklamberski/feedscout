import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type PikaUrl, parsePikaUrl, pikaHandler } from './pika.js'

describe('parsePikaUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: PikaUrl = { kind: 'tag', tag: 'books' }

    expect(parsePikaUrl('https://example.pika.page/tag/books')).toEqual(expected)
  })

  it('should return the blog for any other page', () => {
    const expected: PikaUrl = { kind: 'blog' }

    expect(parsePikaUrl('https://example.pika.page/posts/hello')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parsePikaUrl('https://example.com/tag/books')).toBeUndefined()
  })
})

describe('pikaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://bob.pika.page'],
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
    it('should return empty array for a URL outside Pika', () => {
      expect(pikaHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the tag feed for a capitalized tag segment', () => {
      const value = 'https://alice.pika.page/Tag/tech'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.pika.page/tag/tech/feed',
          hint: { key: 'pika:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.pika.page/tag/tech/feed.rss',
          hint: { key: 'pika:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return Atom and RSS feeds for blog', () => {
      const value = 'https://bob.pika.page'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and main feeds for tag page', () => {
      const value = 'https://alice.pika.page/tag/tech'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.pika.page/tag/tech/feed',
          hint: { key: 'pika:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.pika.page/tag/tech/feed.rss',
          hint: { key: 'pika:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://bob.pika.page/some-article-slug'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.pika.page/posts_feed',
          hint: { key: 'pika:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.pika.page/posts_feed.rss',
          hint: { key: 'pika:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(pikaHandler.resolve(value)).toEqual(expected)
    })
  })
})
