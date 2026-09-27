import { describe, expect, it } from 'bun:test'
import { proseHandler } from './prose.js'

describe('proseHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.prose.sh'],
      [true, 'https://blog.example.prose.sh'],
      [true, 'https://prose.sh'],
      [true, 'https://www.prose.sh'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(proseHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(proseHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://alice.prose.sh'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.prose.sh/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag-filtered feed when tag query is set', () => {
      const value = 'https://alice.prose.sh/?tag=announcement'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss?tag=announcement',
          hint: { key: 'prose:tag', label: 'Tag' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return discovery feed for apex prose.sh', () => {
      const value = 'https://prose.sh/'
      const expected = [
        {
          uri: 'https://prose.sh/rss',
          hint: { key: 'prose:discovery', label: 'Discovery' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return discovery feed for www apex', () => {
      const value = 'https://www.prose.sh/'
      const expected = [
        {
          uri: 'https://prose.sh/rss',
          hint: { key: 'prose:discovery', label: 'Discovery' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })
  })
})
