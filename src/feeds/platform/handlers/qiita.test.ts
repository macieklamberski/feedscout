import { describe, expect, it } from 'bun:test'
import { qiitaHandler } from './qiita.js'

describe('qiitaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://qiita.com/Qiita'],
      [true, 'https://www.qiita.com/user'],
      [true, 'https://qiita.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(qiitaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(qiitaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://qiita.com/Qiita'
      const expected = [
        {
          uri: 'https://qiita.com/Qiita/feed.atom',
          hint: { key: 'qiita:posts', label: 'Posts' },
        },
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://qiita.com/Qiita/items/some-article'
      const expected = [
        {
          uri: 'https://qiita.com/Qiita/feed.atom',
          hint: { key: 'qiita:posts', label: 'Posts' },
        },
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for tag page', () => {
      const value = 'https://qiita.com/tags/javascript'
      const expected = [
        {
          uri: 'https://qiita.com/tags/javascript/feed.atom',
          hint: { key: 'qiita:tag', label: 'Tag' },
        },
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for organization page', () => {
      const value = 'https://qiita.com/organizations/qiita-inc'
      const expected = [
        {
          uri: 'https://qiita.com/organizations/qiita-inc/activities.atom',
          hint: { key: 'qiita:organization', label: 'Organization' },
        },
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for popular items page', () => {
      const value = 'https://qiita.com/popular-items'
      const expected = [
        {
          uri: 'https://qiita.com/popular-items/feed.atom',
          hint: { key: 'qiita:popular', label: 'Popular items' },
        },
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://qiita.com/'

      expect(qiitaHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for bare tags path', () => {
      const value = 'https://qiita.com/tags'

      expect(qiitaHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://qiita.com/about',
        'https://qiita.com/api',
        'https://qiita.com/login',
        'https://qiita.com/organizations',
        'https://qiita.com/privacy',
        'https://qiita.com/search',
        'https://qiita.com/settings',
        'https://qiita.com/signup',
        'https://qiita.com/terms',
        'https://qiita.com/trend',
      ]

      for (const value of values) {
        expect(qiitaHandler.resolve(value)).toEqual([])
      }
    })

    it('should return Qiita Zine feed for /official-columns', () => {
      const value = 'https://qiita.com/official-columns'
      const expected = [
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine' },
        },
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it('should return Qiita Zine feed for /official-columns/{slug}', () => {
      const value = 'https://qiita.com/official-columns/some-article'
      const expected = [
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: { key: 'qiita:zine', label: 'Qiita Zine' },
        },
      ]

      expect(qiitaHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
