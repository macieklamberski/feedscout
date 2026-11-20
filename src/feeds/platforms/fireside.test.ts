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

  it('should return the tag for a tag page', () => {
    const value = 'https://alice.fireside.fm/tags/example%20tag'
    const expected: FiresideUrl = { kind: 'podcast', slug: 'alice', tag: 'example tag' }

    expect(parseFiresideUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseFiresideUrl('https://www.fireside.fm/')).toBeUndefined()
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

    it('should keep the scheme of an http podcast page on its own host', () => {
      const value = 'http://alice.fireside.fm'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.fireside.fm/alice/rss',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'http://alice.fireside.fm/json',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'http://alice.fireside.fm/articles/rss',
          hint: { key: 'fireside:blog', label: 'Blog' },
        },
      ]

      expect(firesideHandler.resolve(value)).toEqual(expected)
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
        {
          uri: 'https://alice.fireside.fm/articles/rss',
          hint: { key: 'fireside:blog', label: 'Blog' },
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
        {
          uri: 'https://alice.fireside.fm/articles/rss',
          hint: { key: 'fireside:blog', label: 'Blog' },
        },
      ]

      expect(firesideHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed first for a tag page', () => {
      const value = 'https://alice.fireside.fm/tags/example%20tag'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.fireside.fm/tags/example%20tag/rss',
          hint: { key: 'fireside:tag', label: 'Tag' },
        },
        {
          uri: 'https://feeds.fireside.fm/alice/rss',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'rss' },
        },
        {
          uri: 'https://alice.fireside.fm/json',
          hint: { key: 'fireside:podcast', label: 'Podcast', format: 'json' },
        },
        {
          uri: 'https://alice.fireside.fm/articles/rss',
          hint: { key: 'fireside:blog', label: 'Blog' },
        },
      ]

      expect(firesideHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(firesideHandler.resolve('https://fireside.fm/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for an RSS feed on the show host', () => {
      const value = 'https://alicecast.fireside.fm/rss'
      const expected: DiscoverUriHint = { key: 'fireside:podcast', label: 'Podcast', format: 'rss' }

      expect(firesideHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return an RSS feed on the show host over http as itself', async () => {
      const value = 'http://alicecast.fireside.fm/rss'
      const hint: DiscoverUriHint = { key: 'fireside:podcast', label: 'Podcast', format: 'rss' }
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
