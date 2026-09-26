import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { dreamwidthHandler } from './dreamwidth.js'

describe('dreamwidthHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://news.dreamwidth.org'],
      [true, 'https://blog.example.dreamwidth.org'],
      [true, 'https://www.dreamwidth.org/users/dw_news'],
      [true, 'https://www.dreamwidth.org/~dw-news'],
      [false, 'https://www.dreamwidth.org'],
      [false, 'https://dreamwidth.org'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(dreamwidthHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(dreamwidthHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS, Atom, and userpics feeds for blog', () => {
      const value = 'https://news.dreamwidth.org'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://news.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://news.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://news.dreamwidth.org/data/userpics',
          hint: { key: 'dreamwidth:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://news.dreamwidth.org/123456.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://news.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://news.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://news.dreamwidth.org/data/userpics',
          hint: { key: 'dreamwidth:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })

    it('should add tag-filtered feeds for /tag/ paths', () => {
      const value = 'https://terriko.dreamwidth.org/tag/ghc09'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://terriko.dreamwidth.org/data/rss?tag=ghc09',
          hint: { key: 'dreamwidth:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/atom?tag=ghc09',
          hint: { key: 'dreamwidth:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/userpics',
          hint: { key: 'dreamwidth:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a percent-encoded tag encoded once', () => {
      const value = 'https://terriko.dreamwidth.org/tag/caf%C3%A9'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://terriko.dreamwidth.org/data/rss?tag=caf%C3%A9',
          hint: { key: 'dreamwidth:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/atom?tag=caf%C3%A9',
          hint: { key: 'dreamwidth:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://terriko.dreamwidth.org/data/userpics',
          hint: { key: 'dreamwidth:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for www host without user selector', () => {
      expect(dreamwidthHandler.resolve('https://www.dreamwidth.org/random')).toEqual([])
    })

    it('should canonicalise www.dreamwidth.org/users/{user} to subdomain with a hyphen', () => {
      const value = 'https://www.dreamwidth.org/users/dw_news'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://dw-news.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://dw-news.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://dw-news.dreamwidth.org/data/userpics',
          hint: { key: 'dreamwidth:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.dreamwidth.org/users/{user} to subdomain with a hyphen with a capitalized users segment', () => {
      const value = 'https://www.dreamwidth.org/Users/dw_news'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://dw-news.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://dw-news.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://dw-news.dreamwidth.org/data/userpics',
          hint: { key: 'dreamwidth:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.dreamwidth.org/~{user} to subdomain', () => {
      const value = 'https://www.dreamwidth.org/~dw-news'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://dw-news.dreamwidth.org/data/rss',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://dw-news.dreamwidth.org/data/atom',
          hint: { key: 'dreamwidth:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://dw-news.dreamwidth.org/data/userpics',
          hint: { key: 'dreamwidth:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(dreamwidthHandler.resolve(value)).toEqual(expected)
    })
  })
})
