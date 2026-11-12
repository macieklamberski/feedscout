import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PikaUrl, parsePikaUrl, pikaHandler } from './pika.js'

describe('parsePikaUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: PikaUrl = { kind: 'tag', blog: 'example', tag: 'books' }

    expect(parsePikaUrl('https://example.pika.page/tag/books')).toEqual(expected)
  })

  it('should return the blog for any other page', () => {
    const expected: PikaUrl = { kind: 'blog', blog: 'example' }

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
      [false, 'https://blog.example.pika.page'],
      [false, 'https://pika.page'],
      [false, 'https://www.pika.page'],
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

    it('should return https feed URLs for an http blog page', () => {
      const value = 'http://alice.pika.page/tag/tech'
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
  })

  describe('getFeedKey', () => {
    it('should return the posts key for an Atom posts feed', () => {
      const value = 'https://alice.pika.page/posts_feed'
      const expected = 'pika:posts'

      expect(pikaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an RSS posts feed', () => {
      const value = 'https://alice.pika.page/posts_feed.rss'
      const expected = 'pika:posts'

      expect(pikaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the posts key for an http posts feed', () => {
      const value = 'http://alice.pika.page/posts_feed'
      const expected = 'pika:posts'

      expect(pikaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for an Atom tag feed', () => {
      const value = 'https://alice.pika.page/tag/tech/feed'
      const expected = 'pika:tag'

      expect(pikaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for an RSS tag feed', () => {
      const value = 'https://alice.pika.page/tag/tech/feed.rss'
      const expected = 'pika:tag'

      expect(pikaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://alice.pika.page/tag/tech'

      expect(pikaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog post', () => {
      const value = 'https://alice.pika.page/posts/hello'

      expect(pikaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex', () => {
      const value = 'https://pika.page/posts_feed'

      expect(pikaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the www host', () => {
      const value = 'https://www.pika.page/posts_feed'

      expect(pikaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.alice.pika.page/posts_feed'

      expect(pikaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/posts_feed'

      expect(pikaHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.pika.page/posts_feed', { key: 'pika:posts', label: 'Posts' }],
      ['https://alice.pika.page/posts_feed.rss', { key: 'pika:posts', label: 'Posts' }],
      ['http://alice.pika.page/posts_feed', { key: 'pika:posts', label: 'Posts' }],
      ['https://alice.pika.page/tag/tech/feed', { key: 'pika:tag', label: 'Tag' }],
      ['https://alice.pika.page/tag/tech/feed.rss', { key: 'pika:tag', label: 'Tag' }],
      ['https://alice.pika.page/tag/tech/feed/', { key: 'pika:tag', label: 'Tag' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [pikaHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
