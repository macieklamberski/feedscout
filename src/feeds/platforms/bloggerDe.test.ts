import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type BloggerDeUrl, bloggerDeHandler, parseBloggerDeUrl } from './bloggerDe.js'

describe('parseBloggerDeUrl', () => {
  const values: Array<[string, BloggerDeUrl]> = [
    ['https://alice.blogger.de/', { kind: 'blog', blog: 'alice' }],
    ['https://Alice.blogger.de/', { kind: 'blog', blog: 'alice' }],
    ['https://alice.blogger.de/stories/2918480/', { kind: 'blog', blog: 'alice' }],
    [
      'https://alice.blogger.de/topics/Ex Libris',
      { kind: 'topic', blog: 'alice', topic: 'Ex Libris' },
    ],
    [
      'https://alice.blogger.de/topics/Best+of+2006/',
      { kind: 'topic', blog: 'alice', topic: 'Best of 2006' },
    ],
  ]

  it.each(values)('should parse %s', (url, expected) => {
    expect(parseBloggerDeUrl(url)).toEqual(expected)
  })

  const unmatched: Array<string> = [
    'https://blogger.de/',
    'https://www.blogger.de/members/login',
    'https://www.alice.blogger.de/',
    'https://example.com/rss',
    'not-a-url',
  ]

  it.each(unmatched)('should return undefined for %s', (url) => {
    expect(parseBloggerDeUrl(url)).toBeUndefined()
  })
})

describe('bloggerDeHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(bloggerDeHandler.match('https://alice.blogger.de/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(bloggerDeHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(bloggerDeHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the posts feed for a blog page', () => {
      const value = 'https://alice.blogger.de/stories/2918480/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogger.de/rss',
          hint: { key: 'blogger-de:posts', label: 'Posts' },
        },
        {
          uri: 'https://alice.blogger.de/rss?show=all',
          hint: { key: 'blogger-de:posts-comments', label: 'Posts and comments' },
        },
      ]

      expect(bloggerDeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the topic feed for a topic page', () => {
      const value = 'https://alice.blogger.de/topics/Best+of+2006/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.blogger.de/rss?topic=Best%20of%202006',
          hint: { key: 'blogger-de:topic', label: 'Topic' },
        },
        {
          uri: 'https://alice.blogger.de/rss',
          hint: { key: 'blogger-de:posts', label: 'Posts' },
        },
        {
          uri: 'https://alice.blogger.de/rss?show=all',
          hint: { key: 'blogger-de:posts-comments', label: 'Posts and comments' },
        },
      ]

      expect(bloggerDeHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http blog page', () => {
      const value = 'http://alice.blogger.de/stories/2918480/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.blogger.de/rss',
          hint: { key: 'blogger-de:posts', label: 'Posts' },
        },
        {
          uri: 'http://alice.blogger.de/rss?show=all',
          hint: { key: 'blogger-de:posts-comments', label: 'Posts and comments' },
        },
      ]

      expect(bloggerDeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts key for a posts feed', () => {
      const value = 'https://alice.blogger.de/rss'
      const expected: DiscoverUriHint = { key: 'blogger-de:posts', label: 'Posts' }

      expect(bloggerDeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts and comments key for a feed of stories and comments', () => {
      const value = 'https://alice.blogger.de/rss?show=all'
      const expected: DiscoverUriHint = {
        key: 'blogger-de:posts-comments',
        label: 'Posts and comments',
      }

      expect(bloggerDeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the topic key for a topic feed', () => {
      const value = 'https://alice.blogger.de/rss?topic=cooking'
      const expected: DiscoverUriHint = { key: 'blogger-de:topic', label: 'Topic' }

      expect(bloggerDeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts key for a posts feed under a topic path', () => {
      const value = 'https://alice.blogger.de/topics/cooking/rss'
      const expected: DiscoverUriHint = { key: 'blogger-de:posts', label: 'Posts' }

      expect(bloggerDeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts key for an http posts feed', () => {
      const value = 'http://alice.blogger.de/rss'
      const expected: DiscoverUriHint = { key: 'blogger-de:posts', label: 'Posts' }

      expect(bloggerDeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://alice.blogger.de/stories/2918480/'

      expect(bloggerDeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://blogger.de/rss'

      expect(bloggerDeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.alice.blogger.de/rss'

      expect(bloggerDeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss'

      expect(bloggerDeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.blogger.de/rss', { key: 'blogger-de:posts', label: 'Posts' }],
      ['https://alice.blogger.de/topics/cooking/rss', { key: 'blogger-de:posts', label: 'Posts' }],
      [
        'http://alice.blogger.de/rss?show=all',
        { key: 'blogger-de:posts-comments', label: 'Posts and comments' },
      ],
      ['http://alice.blogger.de/rss?topic=cooking', { key: 'blogger-de:topic', label: 'Topic' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [bloggerDeHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
