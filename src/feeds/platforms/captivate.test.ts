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

  it('should return undefined for the feed host', () => {
    expect(parseCaptivateUrl('https://feeds.captivate.fm/myshow/')).toBeUndefined()
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
      const expected = [
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/',
          hint: { key: 'captivate:podcast', label: 'Podcast' },
        },
      ]

      expect(captivateHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice-podcast.captivate.fm/episodes'
      const expected = [
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/',
          hint: { key: 'captivate:podcast', label: 'Podcast' },
        },
      ]

      expect(captivateHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(captivateHandler.resolve('https://captivate.fm/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the podcast key for a feed', () => {
      const value = 'https://feeds.captivate.fm/bluntdissection/'
      const expected = 'captivate:podcast'

      expect(captivateHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a feed with a hyphenated slug', () => {
      const value = 'https://feeds.captivate.fm/flies-in-the-jar/'
      const expected = 'captivate:podcast'

      expect(captivateHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a feed without the trailing slash', () => {
      const value = 'https://feeds.captivate.fm/bluntdissection'
      const expected = 'captivate:podcast'

      expect(captivateHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a feed over http', () => {
      const value = 'http://feeds.captivate.fm/bluntdissection/'
      const expected = 'captivate:podcast'

      expect(captivateHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a show page', () => {
      const value = 'https://bluntdissection.captivate.fm/'

      expect(captivateHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed host root', () => {
      const value = 'https://feeds.captivate.fm/'

      expect(captivateHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a nested path on the feed host', () => {
      const value = 'https://feeds.captivate.fm/bluntdissection/episodes/'

      expect(captivateHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/bluntdissection/'

      expect(captivateHandler.getFeedKey?.(value)).toBeUndefined()
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
