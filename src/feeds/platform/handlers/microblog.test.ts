import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { microblogHandler } from './microblog.js'

describe('microblogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://manton.micro.blog'],
      [true, 'https://blog.example.micro.blog'],
      [false, 'https://micro.blog'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(microblogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(microblogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS, JSON, and podcast feeds for blog', () => {
      const value = 'https://manton.micro.blog'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://manton.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feeds for category page', () => {
      const value = 'https://manton.micro.blog/categories/test'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://manton.micro.blog/categories/test/feed.xml',
          hint: { key: 'microblog:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/categories/test/feed.json',
          hint: { key: 'microblog:category', label: 'Category', format: 'json' },
        },
        {
          uri: 'https://manton.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return archive feed for archive page', () => {
      const value = 'https://manton.micro.blog/archive'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://manton.micro.blog/archive/index.json',
          hint: { key: 'microblog:archive', label: 'Archive' },
        },
        {
          uri: 'https://manton.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return photos feed for photos page', () => {
      const value = 'https://manton.micro.blog/photos'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://manton.micro.blog/photos/index.json',
          hint: { key: 'microblog:photos', label: 'Photos' },
        },
        {
          uri: 'https://manton.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return replies feed for replies page', () => {
      const value = 'https://manton.micro.blog/replies'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://manton.micro.blog/replies.xml',
          hint: { key: 'microblog:replies', label: 'Replies' },
        },
        {
          uri: 'https://manton.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://manton.micro.blog/2024/01/01/some-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://manton.micro.blog/feed.xml',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/feed.json',
          hint: { key: 'microblog:posts', label: 'Posts', format: 'json' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.xml',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://manton.micro.blog/podcast.json',
          hint: { key: 'microblog:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(microblogHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
