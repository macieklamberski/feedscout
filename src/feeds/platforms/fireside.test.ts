import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type FiresideUrl, firesideHandler, parseFiresideUrl } from './fireside.js'

describe('parseFiresideUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const expected: FiresideUrl = { kind: 'podcast', slug: 'myshow' }

    expect(parseFiresideUrl('https://myshow.fireside.fm/')).toEqual(expected)
  })

  it('should return undefined for an excluded subdomain', () => {
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
      [true, 'https://blog.example.fireside.fm'],
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
})
