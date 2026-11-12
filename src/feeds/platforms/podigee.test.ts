import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PodigeeUrl, parsePodigeeUrl, podigeeHandler } from './podigee.js'

describe('parsePodigeeUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const value = 'https://example.podigee.io/'
    const expected: PodigeeUrl = { kind: 'podcast', podcast: 'example' }

    expect(parsePodigeeUrl(value)).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePodigeeUrl('https://www.example.podigee.io/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePodigeeUrl('https://example.com/')).toBeUndefined()
  })
})

describe('podigeeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.podigee.io'],
      [true, 'https://anything.podigee.io/episodes'],
      [false, 'https://podigee.io'],
      [false, 'https://example.com'],
      [false, 'https://www.podigee.io'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(podigeeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(podigeeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Podigee', () => {
      expect(podigeeHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return podcast feed for show', () => {
      const value = 'https://alice.podigee.io'
      const expected = [
        {
          uri: 'https://alice.podigee.io/feed/mp3',
          hint: { key: 'podigee:podcast', label: 'Podcast' },
        },
      ]

      expect(podigeeHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.podigee.io/episodes/123'
      const expected = [
        {
          uri: 'https://alice.podigee.io/feed/mp3',
          hint: { key: 'podigee:podcast', label: 'Podcast' },
        },
      ]

      expect(podigeeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feed for a show opened over http', () => {
      const value = 'http://alice.podigee.io/episodes'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.podigee.io/feed/mp3',
          hint: { key: 'podigee:podcast', label: 'Podcast' },
        },
      ]

      expect(podigeeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the podcast key for the mp3 feed', () => {
      const value = 'https://alice.podigee.io/feed/mp3'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for the aac feed', () => {
      const value = 'https://alice.podigee.io/feed/aac'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for the opus feed', () => {
      const value = 'https://alice.podigee.io/feed/opus'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for the vorbis feed', () => {
      const value = 'https://alice.podigee.io/feed/vorbis'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for the mp3 feed with a trailing slash', () => {
      const value = 'https://alice.podigee.io/feed/mp3/'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for the mp3 feed with a source parameter', () => {
      const value = 'https://alice.podigee.io/feed/mp3?source=itunes'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for the mp3 feed with an auth token', () => {
      const value = 'https://alice.podigee.io/feed/mp3?auth=abc123'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a further mp3 feed of a show', () => {
      const value = 'https://alice.podigee.io/feeds/new_feed_12345/mp3'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a further aac feed of a show', () => {
      const value = 'https://alice.podigee.io/feeds/new_feed_12345/aac'
      const expected = 'podigee:podcast'

      expect(podigeeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a page of a show', () => {
      const value = 'https://alice.podigee.io/episodes'

      expect(podigeeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed of a network', () => {
      const value = 'https://alice.network.podigee.io/feed/mp3'

      expect(podigeeHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'podigee:podcast', label: 'Podcast' }
    const values = [
      'https://alice.podigee.io/feed/aac',
      'https://alice.podigee.io/feed/opus',
      'https://alice.podigee.io/feed/vorbis',
      'https://alice.podigee.io/feed/mp3/',
      'https://alice.podigee.io/feed/mp3?source=itunes',
      'https://alice.podigee.io/feeds/new_feed_12345/mp3',
      'https://alice.podigee.io/feeds/new_feed_12345/opus',
      'https://alice.podigee.io/feeds/new_feed_12345/vorbis',
    ]

    it.each(values)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [podigeeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
