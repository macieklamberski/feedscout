import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { VelogUrl } from './velog.js'
import { parseVelogUrl, velogHandler } from './velog.js'

describe('parseVelogUrl', () => {
  it('should return the username for a profile page', () => {
    const expected: VelogUrl = { kind: 'user', username: 'alice' }

    expect(parseVelogUrl('https://velog.io/@alice')).toEqual(expected)
  })

  it('should return the username for profile subpages', () => {
    const expected: VelogUrl = { kind: 'user', username: 'alice' }

    expect(parseVelogUrl('https://velog.io/@alice/posts')).toEqual(expected)
    expect(parseVelogUrl('https://velog.io/@alice/series')).toEqual(expected)
    expect(parseVelogUrl('https://velog.io/@alice/about')).toEqual(expected)
  })

  it('should return the username for a post page', () => {
    const value = 'https://velog.io/@alice/some-post-slug'
    const expected: VelogUrl = { kind: 'user', username: 'alice' }

    expect(parseVelogUrl(value)).toEqual(expected)
  })

  it('should return the username for the www host', () => {
    const expected: VelogUrl = { kind: 'user', username: 'alice' }

    expect(parseVelogUrl('https://www.velog.io/@alice')).toEqual(expected)
  })

  it('should decode an encoded username', () => {
    const expected: VelogUrl = { kind: 'user', username: '김' }

    expect(parseVelogUrl('https://velog.io/@%EA%B9%80')).toEqual(expected)
  })

  it('should return undefined for a malformed encoded username', () => {
    expect(parseVelogUrl('https://velog.io/@%E0%A4%A')).toBeUndefined()
  })

  it('should read a tag page as the home page', () => {
    const expected: VelogUrl = { kind: 'home' }

    expect(parseVelogUrl('https://velog.io/tags/react')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: VelogUrl = { kind: 'home' }

    expect(parseVelogUrl('https://velog.io/')).toEqual(expected)
  })

  it('should read another page as the home page', () => {
    const expected: VelogUrl = { kind: 'home' }

    expect(parseVelogUrl('https://velog.io/trending')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseVelogUrl('https://example.com/@alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseVelogUrl('not-a-url')).toBeUndefined()
  })
})

describe('velogHandler', () => {
  describe('match', () => {
    it('should match a velog.io URL', () => {
      expect(velogHandler.match('https://velog.io')).toBe(true)
    })

    it('should not match another host', () => {
      expect(velogHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    const trendingFeed: DiscoverUriEntry = {
      uri: 'https://v2.velog.io/rss',
      hint: { key: 'velog:trending', label: 'Trending' },
    }

    it('should return feed URL for user', () => {
      const value = 'https://velog.io/@alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://v2.velog.io/rss/alice',
          hint: { key: 'velog:posts', label: 'Posts' },
        },
        trendingFeed,
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should percent-encode a non-ASCII username', () => {
      const value = 'https://velog.io/@%EA%B9%80'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://v2.velog.io/rss/%EA%B9%80',
          hint: { key: 'velog:posts', label: 'Posts' },
        },
        trendingFeed,
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for root path', () => {
      const value = 'https://velog.io/'
      const expected = [
        {
          uri: 'https://v2.velog.io/rss',
          hint: { key: 'velog:trending', label: 'Trending' },
        },
      ]

      expect(velogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a user feed', () => {
      const value = 'https://v2.velog.io/rss/bob_dev'
      const expected: DiscoverUriHint = { key: 'velog:posts', label: 'Posts' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a user feed with an at sign', () => {
      const value = 'https://v2.velog.io/rss/@carol1215'
      const expected: DiscoverUriHint = { key: 'velog:posts', label: 'Posts' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a percent-encoded username', () => {
      const value = 'https://v2.velog.io/rss/%EA%B9%80'
      const expected: DiscoverUriHint = { key: 'velog:posts', label: 'Posts' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed with a trailing slash', () => {
      const value = 'https://v2.velog.io/rss/dave3/'
      const expected: DiscoverUriHint = { key: 'velog:posts', label: 'Posts' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed over http', () => {
      const value = 'http://v2.velog.io/rss/dave3'
      const expected: DiscoverUriHint = { key: 'velog:posts', label: 'Posts' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a capitalized route', () => {
      const value = 'https://v2.velog.io/RSS/dave3'
      const expected: DiscoverUriHint = { key: 'velog:posts', label: 'Posts' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the trending hint for the trending feed', () => {
      const value = 'https://v2.velog.io/rss'
      const expected: DiscoverUriHint = { key: 'velog:trending', label: 'Trending' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the trending hint for the trending feed with a trailing slash', () => {
      const value = 'https://v2.velog.io/rss/'
      const expected: DiscoverUriHint = { key: 'velog:trending', label: 'Trending' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a user feed on the api host', () => {
      const value = 'https://api.velog.io/rss/alice'
      const expected: DiscoverUriHint = { key: 'velog:posts', label: 'Posts' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the trending hint for the trending feed on the api host', () => {
      const value = 'https://api.velog.io/rss'
      const expected: DiscoverUriHint = { key: 'velog:trending', label: 'Trending' }

      expect(velogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://velog.io/@bob_dev'

      expect(velogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed path on the page host', () => {
      const value = 'https://velog.io/rss/bob_dev'

      expect(velogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a path below a user feed', () => {
      const value = 'https://v2.velog.io/rss/bob_dev/posts'

      expect(velogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss/bob_dev'

      expect(velogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://v2.velog.io/rss/bob_dev', { key: 'velog:posts', label: 'Posts' }],
      ['https://v2.velog.io/rss/@carol1215', { key: 'velog:posts', label: 'Posts' }],
      ['https://v2.velog.io/rss', { key: 'velog:trending', label: 'Trending' }],
      ['https://api.velog.io/rss/alice', { key: 'velog:posts', label: 'Posts' }],
      ['https://api.velog.io/rss', { key: 'velog:trending', label: 'Trending' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [velogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
