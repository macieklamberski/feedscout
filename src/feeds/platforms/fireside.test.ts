import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type FiresideUrl, firesideHandler, parseFiresideUrl } from './fireside.js'

describe('parseFiresideUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const expected: FiresideUrl = { kind: 'podcast', slug: 'myshow' }

    expect(parseFiresideUrl('https://myshow.fireside.fm/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseFiresideUrl('https://www.fireside.fm/')).toBeUndefined()
  })

  it('should return undefined for the feed host', () => {
    expect(parseFiresideUrl('https://feeds.fireside.fm/myshow/rss')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseFiresideUrl('https://example.com/')).toBeUndefined()
  })
})

describe('firesideHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.fireside.fm'],
      [false, 'https://blog.example.fireside.fm'],
      [false, 'https://www.fireside.fm'],
      [false, 'https://fireside.fm'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(firesideHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(firesideHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Fireside', () => {
      expect(firesideHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS and JSON feeds for podcast', () => {
      const value = 'https://alice.fireside.fm'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.fireside.fm/alice/rss',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://alice.fireside.fm/json',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(firesideHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://alice.fireside.fm/episodes/some-episode'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.fireside.fm/alice/rss',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://alice.fireside.fm/json',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'json' },
        },
      ]

      expect(firesideHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(firesideHandler.resolve('https://fireside.fm/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for an RSS feed', () => {
      const value = 'https://feeds.fireside.fm/99zueins/rss'
      const expected: DiscoverUriHint = { key: 'fireside:podcast', label: 'Podcast', format: 'rss' }

      expect(firesideHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for an RSS feed with a trailing slash', () => {
      const value = 'https://feeds.fireside.fm/podcastmethod/rss/'
      const expected: DiscoverUriHint = { key: 'fireside:podcast', label: 'Podcast', format: 'rss' }

      expect(firesideHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a JSON feed', () => {
      const value = 'https://99zueins.fireside.fm/json'
      const expected: DiscoverUriHint = {
        key: 'fireside:podcast',
        label: 'Podcast',
        format: 'json',
      }

      expect(firesideHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a show page', () => {
      const value = 'https://99zueins.fireside.fm/'

      expect(firesideHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a show path on the feed host', () => {
      const value = 'https://feeds.fireside.fm/99zueins'

      expect(firesideHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag feed', () => {
      const value = 'https://99zueins.fireside.fm/tags/podcast/rss'

      expect(firesideHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a JSON feed on a nested subdomain', () => {
      const value = 'https://blog.example.fireside.fm/json'

      expect(firesideHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a JSON feed on the www host', () => {
      const value = 'https://www.fireside.fm/json'

      expect(firesideHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/json'

      expect(firesideHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://feeds.fireside.fm/99zueins/rss',
        { key: 'fireside:podcast', label: 'Podcast', format: 'rss' },
      ],
      [
        'https://feeds.fireside.fm/assets/rss',
        { key: 'fireside:podcast', label: 'Podcast', format: 'rss' },
      ],
      [
        'https://feeds.fireside.fm/podcastmethod/rss/',
        { key: 'fireside:podcast', label: 'Podcast', format: 'rss' },
      ],
      [
        'https://99zueins.fireside.fm/json',
        { key: 'fireside:podcast', label: 'Podcast', format: 'json' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [firesideHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
