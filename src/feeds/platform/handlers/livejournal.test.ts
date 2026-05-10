import { describe, expect, it } from 'bun:test'
import { livejournalHandler } from './livejournal.js'

describe('livejournalHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://ohnotheydidnt.livejournal.com', true],
      ['https://blog.example.livejournal.com', true],
      ['https://www.livejournal.com/users/news', true],
      ['https://www.livejournal.com/~news', true],
      ['https://users.livejournal.com/news', true],
      ['https://community.livejournal.com/ohnotheydidnt', true],
      ['https://www.livejournal.com', false],
      ['https://users.livejournal.com', false],
      ['https://community.livejournal.com', false],
      ['https://syndicated.livejournal.com', false],
      ['https://livejournal.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(livejournalHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(livejournalHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS, Atom, and userpics feeds for blog', () => {
      const value = 'https://ohnotheydidnt.livejournal.com'
      const expected = [
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://ohnotheydidnt.livejournal.com/123456.html'
      const expected = [
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should add tag-filtered feeds for /tag/ paths', () => {
      const value = 'https://ohnotheydidnt.livejournal.com/tag/television'
      const expected = [
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/rss?tag=television',
          hint: { key: 'livejournal:posts-tag-rss', label: 'Tag (RSS)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/atom?tag=television',
          hint: { key: 'livejournal:posts-tag-atom', label: 'Tag (Atom)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.livejournal.com/users/{user} to subdomain', () => {
      const value = 'https://www.livejournal.com/users/news'
      const expected = [
        {
          uri: 'https://news.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://news.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://news.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise users.livejournal.com/{user} legacy host', () => {
      const value = 'https://users.livejournal.com/news'
      const expected = [
        {
          uri: 'https://news.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://news.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://news.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics-atom', label: 'Userpics (Atom)' },
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
      const value = 'https://community.livejournal.com/ohnotheydidnt'
      const expected = [
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://ohnotheydidnt.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })
  })
})
