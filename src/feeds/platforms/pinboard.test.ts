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
    it('should return empty array for a URL outside Pinboard', () => {
      expect(pinboardHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the bookmarks feed for a user page', () => {
      const value = 'https://pinboard.in/u:example/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the username case', () => {
      const value = 'https://pinboard.in/U:Example/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:Example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the bookmarks feed for a user subpage', () => {
      const value = 'https://pinboard.in/u:example/before:12345'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/',
          hint: { key: 'pinboard:bookmarks', label: 'Bookmarks' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a user tag page', () => {
      const value = 'https://pinboard.in/u:example/t:Programming/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/t:Programming/',
          hint: { key: 'pinboard:tag', label: 'Tag' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a user page with several tags', () => {
      const value = 'https://pinboard.in/u:example/T:programming/t:rust'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/u:example/t:programming/t:rust/',
          hint: { key: 'pinboard:tag', label: 'Tag' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the recent feed for the recent page', () => {
      const value = 'https://pinboard.in/recent/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/recent/',
          hint: { key: 'pinboard:recent', label: 'Recent' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the popular feed for the popular page', () => {
      const value = 'https://pinboard.in/popular/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/popular/',
          hint: { key: 'pinboard:popular', label: 'Popular' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a site-wide tag page', () => {
      const value = 'https://pinboard.in/t:programming/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/t:programming/',
          hint: { key: 'pinboard:tag', label: 'Tag' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })

    it('should return the popular feed for the homepage', () => {
      const value = 'https://pinboard.in/'
      const expected = [
        {
          uri: 'https://feeds.pinboard.in/rss/popular/',
          hint: { key: 'pinboard:popular', label: 'Popular' },
        },
      ]

      expect(pinboardHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the bookmarks key for a user feed', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/'
      const expected = 'pinboard:bookmarks'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the bookmarks key for a user feed without a trailing slash', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example'
      const expected = 'pinboard:bookmarks'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the bookmarks key for a user feed over http', () => {
      const value = 'http://feeds.pinboard.in/rss/u:example/'
      const expected = 'pinboard:bookmarks'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the recent key for the recent feed', () => {
      const value = 'https://feeds.pinboard.in/rss/recent/'
      const expected = 'pinboard:recent'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the popular key for the popular feed', () => {
      const value = 'https://feeds.pinboard.in/rss/popular'
      const expected = 'pinboard:popular'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a user tag feed', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/t:programming/'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a user tag feed without a trailing slash', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/t:programming'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a user tag feed over http', () => {
      const value = 'http://feeds.pinboard.in/rss/u:example/t:programming/'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a user feed with several tags', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/t:programming/t:rust/t:async/'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a tag holding a colon', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/t:via:shortcuts/'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a tag holding an encoded slash', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/t:rust%252fasync/'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a site-wide tag feed', () => {
      const value = 'https://feeds.pinboard.in/rss/t:programming/'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a tag feed with a count parameter', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/t:programming?count=4'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should read the tag feed route words in any case', () => {
      const value = 'https://feeds.pinboard.in/RSS/U:example/T:programming/'
      const expected = 'pinboard:tag'

      expect(pinboardHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user tag page', () => {
      const value = 'https://pinboard.in/u:example/t:programming/'

      expect(pinboardHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a private feed', () => {
      const value = 'https://feeds.pinboard.in/rss/secret:abc123/u:example/t:programming/'

      expect(pinboardHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag feed narrowed by source', () => {
      const value = 'https://feeds.pinboard.in/rss/u:example/t:programming/from:twitter'

      expect(pinboardHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag feed path on another host', () => {
      const value = 'https://example.com/rss/u:example/t:programming/'

      expect(pinboardHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(pinboardHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://feeds.pinboard.in/rss/u:example/',
        { key: 'pinboard:bookmarks', label: 'Bookmarks' },
      ],
      [
        'https://feeds.pinboard.in/rss/u:example/t:programming/t:rust/',
        { key: 'pinboard:tag', label: 'Tag' },
      ],
      ['https://feeds.pinboard.in/rss/t:programming/', { key: 'pinboard:tag', label: 'Tag' }],
      ['https://feeds.pinboard.in/rss/recent/', { key: 'pinboard:recent', label: 'Recent' }],
      ['https://feeds.pinboard.in/rss/popular/', { key: 'pinboard:popular', label: 'Popular' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
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
