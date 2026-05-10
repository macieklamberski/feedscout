import { describe, expect, it } from 'bun:test'
import { proseHandler } from './prose.js'

describe('proseHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://hey.prose.sh', true],
      ['https://blog.example.prose.sh', true],
      ['https://prose.sh', true],
      ['https://www.prose.sh', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(proseHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(proseHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://hey.prose.sh'
      const expected = [
        {
          uri: 'https://hey.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://hey.prose.sh/some-article-slug'
      const expected = [
        {
          uri: 'https://hey.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag-filtered feed when tag query is set', () => {
      const value = 'https://hey.prose.sh/?tag=announcement'
      const expected = [
        {
          uri: 'https://hey.prose.sh/rss?tag=announcement',
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
  })
})
