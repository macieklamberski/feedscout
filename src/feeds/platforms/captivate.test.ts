import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type CaptivateUrl, captivateHandler, parseCaptivateUrl } from './captivate.js'

describe('parseCaptivateUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: CaptivateUrl = { kind: 'show', slug: 'myshow' }

    expect(parseCaptivateUrl('https://myshow.captivate.fm/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseCaptivateUrl('https://www.captivate.fm/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseCaptivateUrl('https://a.b.captivate.fm/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCaptivateUrl('https://example.com/')).toBeUndefined()
  })
})

describe('captivateHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.captivate.fm'],
      [true, 'https://alice-podcast.captivate.fm/listen'],
      [false, 'https://captivate.fm'],
      [false, 'https://www.captivate.fm'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(captivateHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(captivateHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(captivateHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast', () => {
      const value = 'https://alice-podcast.captivate.fm'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/',
          hint: { key: 'captivate:podcast', label: 'Podcast' },
        },
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/latest/',
          hint: { key: 'captivate:latest', label: 'Latest episode' },
        },
      ]

      expect(captivateHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice-podcast.captivate.fm/episodes'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/',
          hint: { key: 'captivate:podcast', label: 'Podcast' },
        },
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/latest/',
          hint: { key: 'captivate:latest', label: 'Latest episode' },
        },
      ]

      expect(captivateHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(captivateHandler.resolve('https://captivate.fm/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a feed', () => {
      const value = 'https://feeds.captivate.fm/bluntdissection/'
      const expected: DiscoverUriHint = { key: 'captivate:podcast', label: 'Podcast' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a feed with a hyphenated slug', () => {
      const value = 'https://feeds.captivate.fm/flies-in-the-jar/'
      const expected: DiscoverUriHint = { key: 'captivate:podcast', label: 'Podcast' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a feed without the trailing slash', () => {
      const value = 'https://feeds.captivate.fm/bluntdissection'
      const expected: DiscoverUriHint = { key: 'captivate:podcast', label: 'Podcast' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a feed over http', () => {
      const value = 'http://feeds.captivate.fm/bluntdissection/'
      const expected: DiscoverUriHint = { key: 'captivate:podcast', label: 'Podcast' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a show page', () => {
      const value = 'https://bluntdissection.captivate.fm/'

      expect(captivateHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed host root', () => {
      const value = 'https://feeds.captivate.fm/'

      expect(captivateHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the latest hint for a latest episode feed', () => {
      const value = 'https://feeds.captivate.fm/example/latest/'
      const expected: DiscoverUriHint = { key: 'captivate:latest', label: 'Latest episode' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the network hint for a network feed', () => {
      const value = 'https://feeds.captivate.fm/n/example-network/'
      const expected: DiscoverUriHint = { key: 'captivate:network', label: 'Network' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a private feed', () => {
      const value = 'https://private.captivate.fm/abc123/def456'
      const expected: DiscoverUriHint = { key: 'captivate:podcast', label: 'Podcast' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collection hint for a collection feed', () => {
      const value = 'https://feeds.captivate.fm/example/season-1/'
      const expected: DiscoverUriHint = { key: 'captivate:collection', label: 'Collection' }

      expect(captivateHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/bluntdissection/'

      expect(captivateHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://feeds.captivate.fm/bluntdissection/',
        { key: 'captivate:podcast', label: 'Podcast' },
      ],
      [
        'https://feeds.captivate.fm/flies-in-the-jar/',
        { key: 'captivate:podcast', label: 'Podcast' },
      ],
      [
        'https://feeds.captivate.fm/example/latest',
        { key: 'captivate:latest', label: 'Latest episode' },
      ],
      [
        'http://feeds.captivate.fm/n/example-network/',
        { key: 'captivate:network', label: 'Network' },
      ],
      [
        'https://feeds.captivate.fm/example/season-1',
        { key: 'captivate:collection', label: 'Collection' },
      ],
      [
        'https://private.captivate.fm/abc123/def456',
        { key: 'captivate:podcast', label: 'Podcast' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [captivateHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
