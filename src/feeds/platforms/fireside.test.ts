import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { firesideHandler } from './fireside.js'

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
