import { describe, expect, it } from 'bun:test'
import { firesideHandler } from './fireside.js'

describe('firesideHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://office.fireside.fm', true],
      ['https://blog.example.fireside.fm', true],
      ['https://fireside.fm', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
