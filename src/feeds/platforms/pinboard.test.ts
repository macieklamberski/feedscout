import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PinboardUrl, parsePinboardUrl, pinboardHandler } from './pinboard.js'

describe('parsePinboardUrl', () => {
  it('should return the user for a user page', () => {
    const expected: PinboardUrl = { kind: 'user', username: 'example' }

    expect(parsePinboardUrl('https://pinboard.in/u:example/')).toEqual(expected)
  })

  it('should return the user tags for a user tag page', () => {
    const expected: PinboardUrl = { kind: 'userTag', username: 'example', tags: ['rss', 'atom'] }

    expect(parsePinboardUrl('https://pinboard.in/u:example/t:rss/t:atom/')).toEqual(expected)
  })

  it('should return the user tags and source for a user source page', () => {
    const value = 'https://pinboard.in/u:example/t:rss/from:twitter/'
    const expected: PinboardUrl = {
      kind: 'userSource',
      username: 'example',
      tags: ['rss'],
      source: 'twitter',
    }

    expect(parsePinboardUrl(value)).toEqual(expected)
  })

  it('should return the tags for a site-wide tag page', () => {
    const expected: PinboardUrl = { kind: 'tag', tags: ['rss'] }

    expect(parsePinboardUrl('https://pinboard.in/t:rss/')).toEqual(expected)
  })

  it('should return the recent page', () => {
    const expected: PinboardUrl = { kind: 'recent' }

    expect(parsePinboardUrl('https://pinboard.in/recent/')).toEqual(expected)
  })

  it('should return the popular page for any other page', () => {
    const expected: PinboardUrl = { kind: 'popular' }

    expect(parsePinboardUrl('https://pinboard.in/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parsePinboardUrl('https://example.com/u:example/')).toBeUndefined()
  })
})

describe('pinboardHandler', () => {
  describe('match', () => {
    it('should match a Pinboard URL', () => {
      expect(pinboardHandler.match('https://pinboard.in/u:example/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(pinboardHandler.match('https://example.com/u:example/')).toBe(false)
    })
  })

  describe('resolve', () => {
    const recentFeed: DiscoverUriEntry = {
      uri: 'https://feeds.pinboard.in/rss/recent/',
      hint: { key: 'pinboard:recent', label: 'Recent' },
    }
    const popularFeed: DiscoverUriEntry = {
      uri: 'https://feeds.pinboard.in/rss/popular/',
      hint: { key: 'pinboard:popular', label: 'Popular' },
    }

    it('should return empty array for a URL outside Pinboard', () => {
      expect(pinboardHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the bookmarks feed for a user page', () => {
      const value = 'https://pinboard.in/u:example/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the source feed for a user source page', () => {
      const value = 'https://pinboard.in/u:example/from:twitter/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/from:twitter/',
          hint: { key: 'pinboard:source', label: 'Source' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the source feed with tags for a user source page with tags', () => {
      const value = 'https://pinboard.in/u:example/t:rss/t:atom/from:twitter/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/t:rss/t:atom/from:twitter/',
          hint: { key: 'pinboard:source', label: 'Source' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the username case', () => {
      const value = 'https://pinboard.in/U:Example/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:Example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the bookmarks feed for a user subpage', () => {
      const value = 'https://pinboard.in/u:example/before:12345'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user tag feed for a user tag page', () => {
      const value = 'https://pinboard.in/u:example/t:Programming/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/t:Programming/',
          hint: { key: 'pinboard:user-tag', label: 'User tag' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user tag feed for a user page with several tags', () => {
      const value = 'https://pinboard.in/u:example/T:programming/t:rust'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/t:programming/t:rust/',
          hint: { key: 'pinboard:user-tag', label: 'User tag' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the recent feed for the recent page', () => {
      const value = 'https://pinboard.in/recent/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/recent/',
          hint: { key: 'pinboard:recent', label: 'Recent' },
        },
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the popular feed for the popular page', () => {
      const value = 'https://pinboard.in/popular/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/popular/',
          hint: { key: 'pinboard:popular', label: 'Popular' },
        },
        recentFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a site-wide tag page', () => {
      const value = 'https://pinboard.in/t:programming/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/t:programming/',
          hint: { key: 'pinboard:tag', label: 'Tag' },
        },
        recentFeed,
        popularFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the popular feed for the homepage', () => {
      const value = 'https://pinboard.in/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.pinboard.in/rss/popular/',
          hint: { key: 'pinboard:popular', label: 'Popular' },
        },
        recentFeed,
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the bookmarks hint for a user feed', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/'
      const expected: DiscoverUriHint = { key: 'pinboard:bookmarks', label: 'Bookmarks' }

      expect(pinboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the private bookmarks hint for a private user feed', () => {
      const value = 'https://feeds.pinboard.in/rss/secret:abc123/u:example'
      const expected: DiscoverUriHint = {
        key: 'pinboard:private-bookmarks',
        label: 'Private bookmarks',
      }

      expect(pinboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the private tag hint for a private tag feed', () => {
      const value = 'https://feeds.pinboard.in/rss/secret:abc123/u:example/t:programming'
      const expected: DiscoverUriHint = { key: 'pinboard:private-tag', label: 'Private tag' }

      expect(pinboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the network hint for a private network feed', () => {
      const value = 'https://feeds.pinboard.in/rss/secret:abc123/u:example/network'
      const expected: DiscoverUriHint = { key: 'pinboard:network', label: 'Network' }

      expect(pinboardHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the starred hint for a private starred feed', () => {
      const value = 'https://feeds.pinboard.in/rss/secret:abc123/u:example/starred'
      const expected: DiscoverUriHint = { key: 'pinboard:starred', label: 'Starred' }

      expect(pinboardHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a user feed as itself', async () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/'
      const hint: DiscoverUriHint = { key: 'pinboard:bookmarks', label: 'Bookmarks' }
      const options = {
        ...defaultPlatformOptions,
        handlers: [pinboardHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
