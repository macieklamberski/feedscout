import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { livejournalHandler } from './livejournal.js'

describe('livejournalHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.livejournal.com'],
      [true, 'https://blog.example.livejournal.com'],
      [true, 'https://www.livejournal.com/users/bob'],
      [true, 'https://www.livejournal.com/~bob'],
      [true, 'https://users.livejournal.com/bob'],
      [true, 'https://community.livejournal.com/alice'],
      [false, 'https://www.livejournal.com'],
      [false, 'https://users.livejournal.com'],
      [false, 'https://community.livejournal.com'],
      [false, 'https://syndicated.livejournal.com'],
      [false, 'https://livejournal.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(livejournalHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(livejournalHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the tag feed for a capitalized tag segment', () => {
      const value = 'https://alice.livejournal.com/Tag/television'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.livejournal.com/data/rss?tag=television',
          hint: { key: 'livejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom?tag=television',
          hint: { key: 'livejournal:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS, Atom, and userpics feeds for blog', () => {
      const value = 'https://alice.livejournal.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://alice.livejournal.com/123456.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should add tag-filtered feeds for /tag/ paths', () => {
      const value = 'https://alice.livejournal.com/tag/television'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.livejournal.com/data/rss?tag=television',
          hint: { key: 'livejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom?tag=television',
          hint: { key: 'livejournal:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a percent-encoded tag encoded once', () => {
      const value = 'https://alice.livejournal.com/tag/caf%C3%A9'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.livejournal.com/data/rss?tag=caf%C3%A9',
          hint: { key: 'livejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom?tag=caf%C3%A9',
          hint: { key: 'livejournal:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.livejournal.com/users/{user} to subdomain', () => {
      const value = 'https://www.livejournal.com/users/bob'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://bob.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.livejournal.com/users/{user} to subdomain with a capitalized users segment', () => {
      const value = 'https://www.livejournal.com/Users/bob'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://bob.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise users.livejournal.com/{user} legacy host', () => {
      const value = 'https://users.livejournal.com/bob'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://bob.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for legacy host without user segment', () => {
      expect(livejournalHandler.resolve('https://users.livejournal.com/')).toEqual([])
    })

    it('should return empty array for www host without user selector', () => {
      expect(livejournalHandler.resolve('https://www.livejournal.com/random')).toEqual([])
    })

    it('should canonicalise community.livejournal.com/{user} legacy host', () => {
      const value = 'https://community.livejournal.com/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })
  })
})
