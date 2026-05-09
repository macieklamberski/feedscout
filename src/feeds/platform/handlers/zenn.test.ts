import { describe, expect, it } from 'bun:test'
import { zennHandler } from './zenn.js'

describe('zennHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://zenn.dev/zenn', true],
      ['https://www.zenn.dev/user', true],
      ['https://zenn.dev', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(zennHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(zennHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://zenn.dev/catnose99'
      const expected = [
        {
          uri: 'https://zenn.dev/catnose99/feed',
          hint: { key: 'zenn:posts', label: 'Posts' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://zenn.dev/catnose99/articles/some-article'
      const expected = [
        {
          uri: 'https://zenn.dev/catnose99/feed',
          hint: { key: 'zenn:posts', label: 'Posts' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for topic page', () => {
      const value = 'https://zenn.dev/topics/react'
      const expected = [
        {
          uri: 'https://zenn.dev/topics/react/feed',
          hint: { key: 'zenn:topic', label: 'Topic' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for short publication page', () => {
      const value = 'https://zenn.dev/p/team_zenn'
      const expected = [
        {
          uri: 'https://zenn.dev/p/team_zenn/feed',
          hint: { key: 'zenn:publication', label: 'Publication' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for long publication page', () => {
      const value = 'https://zenn.dev/publications/team_zenn'
      const expected = [
        {
          uri: 'https://zenn.dev/p/team_zenn/feed',
          hint: { key: 'zenn:publication', label: 'Publication' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://zenn.dev/'

      expect(zennHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://zenn.dev/topics'

      expect(zennHandler.resolve(value)).toEqual([])
    })
  })
})
