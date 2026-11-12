import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseRssComUrl, type RssComUrl, rssComHandler } from './rssCom.js'

describe('parseRssComUrl', () => {
  it('should return the podcast for a podcast page', () => {
    const expected: RssComUrl = { kind: 'podcast', show: 'podcasting101' }

    expect(parseRssComUrl('https://rss.com/podcasts/podcasting101')).toEqual(expected)
  })

  it('should return the podcast for a localized podcast page', () => {
    const expected: RssComUrl = { kind: 'podcast', show: 'podcasting101' }

    expect(parseRssComUrl('https://rss.com/es/podcasts/podcasting101')).toEqual(expected)
  })

  it('should return the podcast for a three-letter locale', () => {
    const expected: RssComUrl = { kind: 'podcast', show: 'podcasting101' }

    expect(parseRssComUrl('https://rss.com/fil/podcasts/podcasting101')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseRssComUrl('https://rss.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseRssComUrl('https://example.com/podcasts/podcasting101')).toBeUndefined()
  })
})

describe('rssComHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://rss.com/podcasts/podcasting101'],
      [true, 'https://www.rss.com/podcasts/some-show'],
      [false, 'https://rss.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(rssComHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(rssComHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://rss.com/podcasts/podcasting101'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for podcast with a capitalized podcasts segment', () => {
      const value = 'https://rss.com/Podcasts/podcasting101'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://rss.com/podcasts/podcasting101/episodes/some-episode'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://rss.com/'

      expect(rssComHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for non-podcast paths', () => {
      const value = 'https://rss.com/about'

      expect(rssComHandler.resolve(value)).toEqual([])
    })

    it('should return feed URL for /es/podcasts/{slug}', () => {
      const value = 'https://rss.com/es/podcasts/podcasting101'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for /it/podcasts/{slug}', () => {
      const value = 'https://rss.com/it/podcasts/podcasting101'
      const expected = [
        {
          uri: 'https://media.rss.com/podcasting101/feed.xml',
          hint: { key: 'rss-com:podcast', label: 'Podcast' },
        },
      ]

      expect(rssComHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a podcast feed', () => {
      const value = 'https://media.rss.com/charismanews/feed.xml'
      const expected: DiscoverUriHint = { key: 'rss-com:podcast', label: 'Podcast' }

      expect(rssComHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a podcast page', () => {
      const value = 'https://rss.com/podcasts/charismanews'

      expect(rssComHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a show path on the feed host without the feed file', () => {
      const value = 'https://media.rss.com/charismanews/'

      expect(rssComHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/charismanews/feed.xml'

      expect(rssComHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://media.rss.com/charismanews/feed.xml', { key: 'rss-com:podcast', label: 'Podcast' }],
      ['https://media.rss.com/kuuske/feed.xml', { key: 'rss-com:podcast', label: 'Podcast' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [rssComHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
