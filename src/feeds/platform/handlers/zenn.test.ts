import { describe, expect, it } from 'bun:test'
import { zennHandler } from './zenn.js'

describe('zennHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://zenn.dev/zenn'],
      [true, 'https://www.zenn.dev/user'],
      [true, 'https://zenn.dev'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
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

    it('should return trending feed for root path', () => {
      const value = 'https://zenn.dev/'
      const expected = [
        {
          uri: 'https://zenn.dev/feed',
          hint: { key: 'zenn:trending', label: 'Trending' },
        },
      ]

      expect(zennHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://zenn.dev/topics',
        'https://zenn.dev/about',
        'https://zenn.dev/api',
        'https://zenn.dev/articles',
        'https://zenn.dev/books',
        'https://zenn.dev/login',
        'https://zenn.dev/notifications',
        'https://zenn.dev/p',
        'https://zenn.dev/privacy',
        'https://zenn.dev/publications',
        'https://zenn.dev/scraps',
        'https://zenn.dev/search',
        'https://zenn.dev/settings',
        'https://zenn.dev/signup',
        'https://zenn.dev/terms',
      ]

      for (const value of values) {
        expect(zennHandler.resolve(value)).toEqual([])
      }
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
