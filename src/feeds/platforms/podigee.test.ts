import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PodigeeUrl, parsePodigeeUrl, podigeeHandler } from './podigee.js'

describe('parsePodigeeUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const value = 'https://example.podigee.io/'
    const expected: PodigeeUrl = { kind: 'podcast' }

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

    it('should return the feed under the page scheme for a show opened over http', () => {
      const value = 'http://alice.podigee.io/episodes'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.podigee.io/feed/mp3',
          hint: { key: 'podigee:podcast', label: 'Podcast' },
        },
      ]

      expect(podigeeHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for the mp3 feed', () => {
      const value = 'https://alice.podigee.io/feed/mp3'
      const expected: DiscoverUriHint = { key: 'podigee:podcast', label: 'Podcast' }

      expect(podigeeHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a further opus feed of a show as itself', async () => {
      const value = 'https://alice.podigee.io/feeds/new_feed_12345/opus'
      const options = {
        ...defaultPlatformOptions,
        handlers: [podigeeHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'podigee:feed-encoding', label: 'Feed in another encoding' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
