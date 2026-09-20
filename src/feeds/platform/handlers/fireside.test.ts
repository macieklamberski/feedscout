import { describe, expect, it } from 'bun:test'
import { firesideHandler } from './fireside.js'

describe('firesideHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://office.fireside.fm'],
      [true, 'https://blog.example.fireside.fm'],
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
      const value = 'https://office.fireside.fm'
      const expected = [
        {
          uri: 'https://feeds.fireside.fm/office/rss',
          hint: { key: 'fireside:podcast-rss', label: 'Podcast (RSS)' },
        },
        {
          uri: 'https://office.fireside.fm/json',
          hint: { key: 'fireside:podcast-json', label: 'Podcast (JSON)' },
        },
      ]

      expect(firesideHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://office.fireside.fm/episodes/some-episode'
      const expected = [
        {
          uri: 'https://feeds.fireside.fm/office/rss',
          hint: { key: 'fireside:podcast-rss', label: 'Podcast (RSS)' },
        },
        {
          uri: 'https://office.fireside.fm/json',
          hint: { key: 'fireside:podcast-json', label: 'Podcast (JSON)' },
        },
      ]

      expect(firesideHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for www.fireside.fm', () => {
      // resolve('https://www.fireside.fm') currently treats www as a podcast slug and emits
      // https://feeds.fireside.fm/www/rss, which is likely a source bug.
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
