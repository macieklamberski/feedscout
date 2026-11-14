import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PodbeanUrl, parsePodbeanUrl, podbeanHandler } from './podbean.js'

describe('parsePodbeanUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const expected: PodbeanUrl = { kind: 'podcast', show: 'example' }

    expect(parsePodbeanUrl('https://example.podbean.com/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parsePodbeanUrl('https://www.podbean.com/')).toBeUndefined()
  })

  it('should return undefined for the feed host', () => {
    expect(parsePodbeanUrl('https://feed.podbean.com/myshow/feed.xml')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePodbeanUrl('https://www.example.podbean.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePodbeanUrl('https://example.com/')).toBeUndefined()
  })
})

describe('podbeanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.podbean.com'],
      [false, 'https://blog.example.podbean.com'],
      [false, 'https://podbean.com'],
      [false, 'https://example.com'],
      [false, 'https://www.podbean.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(podbeanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(podbeanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://alice.podbean.com'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.podbean.com/e/some-episode'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(podbeanHandler.resolve('https://podbean.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a podcast feed', () => {
      const value = 'https://feed.podbean.com/carolcast/feed.xml'
      const expected: DiscoverUriHint = { key: 'podbean:podcast', label: 'Podcast' }

      expect(podbeanHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed over http', () => {
      const value = 'http://feed.podbean.com/bobdoors/feed.xml'
      const expected: DiscoverUriHint = { key: 'podbean:podcast', label: 'Podcast' }

      expect(podbeanHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed on the S3 bucket', () => {
      const value = 'https://s3.amazonaws.com/feed.podbean.com/erinnotes/feed.xml'
      const expected: DiscoverUriHint = { key: 'podbean:podcast', label: 'Podcast' }

      expect(podbeanHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed on the show subdomain', () => {
      const value = 'https://dave1show.podbean.com/feed.xml'
      const expected: DiscoverUriHint = { key: 'podbean:podcast', label: 'Podcast' }

      expect(podbeanHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed cut to its latest episode', () => {
      const value = 'https://feed.podbean.com/alice/last1/feed.xml'
      const expected: DiscoverUriHint = { key: 'podbean:podcast', label: 'Podcast' }

      expect(podbeanHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed path in another S3 bucket', () => {
      const value = 'https://s3.amazonaws.com/other-bucket/erinnotes/feed.xml'

      expect(podbeanHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a show page', () => {
      const value = 'https://carolcast.podbean.com/'

      expect(podbeanHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a show path on the feed host without the feed file', () => {
      const value = 'https://feed.podbean.com/carolcast/'

      expect(podbeanHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/carolcast/feed.xml'

      expect(podbeanHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://feed.podbean.com/carolcast/feed.xml', { key: 'podbean:podcast', label: 'Podcast' }],
      ['https://feed.podbean.com/bobdoors/feed.xml', { key: 'podbean:podcast', label: 'Podcast' }],
      [
        'https://s3.amazonaws.com/feed.podbean.com/erinnotes/feed.xml',
        { key: 'podbean:podcast', label: 'Podcast' },
      ],
      ['https://dave1show.podbean.com/feed.xml', { key: 'podbean:podcast', label: 'Podcast' }],
      [
        'http://feed.podbean.com/alice/last1/feed.xml',
        { key: 'podbean:podcast', label: 'Podcast' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [podbeanHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
