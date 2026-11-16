import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ListedUrl, listedHandler, parseListedUrl } from './listed.js'

describe('parseListedUrl', () => {
  it('should return the blog for a user page', () => {
    const expected: ListedUrl = { kind: 'blog', username: 'writer' }

    expect(parseListedUrl('https://listed.to/@writer')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseListedUrl('https://listed.to/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseListedUrl('https://example.com/')).toBeUndefined()
  })
})

describe('listedHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://listed.to/@Listed'],
      [true, 'https://www.listed.to/@user'],
      [false, 'https://listed.to'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(listedHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(listedHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Listed', () => {
      expect(listedHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://listed.to/@Listed'
      const expected = [
        {
          uri: 'https://listed.to/@Listed/feed.rss',
          hint: { key: 'listed:blog', label: 'Blog' },
        },
      ]

      expect(listedHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://listed.to/@Listed/some-post-slug'
      const expected = [
        {
          uri: 'https://listed.to/@Listed/feed.rss',
          hint: { key: 'listed:blog', label: 'Blog' },
        },
      ]

      expect(listedHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://listed.to/'

      expect(listedHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for paths without @ prefix', () => {
      const value = 'https://listed.to/about'

      expect(listedHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    const feedHints: Array<[string, DiscoverUriHint]> = [
      ['https://listed.to/@alice/feed.rss', { key: 'listed:blog', label: 'Blog' }],
      ['https://listed.to/@alice/feed', { key: 'listed:blog', label: 'Blog' }],
      ['http://listed.to/@alice/feed.rss', { key: 'listed:blog', label: 'Blog' }],
      ['https://listed.to/@alice/feed/', { key: 'listed:blog', label: 'Blog' }],
      ['https://listed.to/authors/12345/feed', { key: 'listed:blog', label: 'Blog' }],
    ]

    it.each(feedHints)('should return the hint of %s', (value, expected) => {
      expect(listedHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://listed.to/@alice'

      expect(listedHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a post page', () => {
      const value = 'https://listed.to/@alice/12345/hello-world'

      expect(listedHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/@alice/feed.rss'

      expect(listedHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<string> = [
      'https://listed.to/@alice/feed.rss',
      'https://listed.to/@alice/feed',
      'http://listed.to/@alice/feed.rss',
      'https://listed.to/@alice/feed.rss/',
      'https://listed.to/authors/12345/feed',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [listedHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'listed:blog', label: 'Blog' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
