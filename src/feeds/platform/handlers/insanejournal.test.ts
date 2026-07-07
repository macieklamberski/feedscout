import { describe, expect, it } from 'bun:test'
import { insanejournalHandler } from './insanejournal.js'

describe('insanejournalHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://random.insanejournal.com'],
      [true, 'https://anything.insanejournal.com/post'],
      [true, 'https://www.insanejournal.com/users/news'],
      [true, 'https://www.insanejournal.com/~news'],
      [true, 'https://www.insanejournal.com/asylum/squeaky'],
      [true, 'https://www.insanejournal.com/community/squeaky'],
      [true, 'https://asylums.insanejournal.com/squeaky'],
      [true, 'https://feeds.insanejournal.com/dw_code_feed'],
      [false, 'https://www.insanejournal.com'],
      [false, 'https://asylums.insanejournal.com'],
      [false, 'https://feeds.insanejournal.com'],
      [false, 'https://insanejournal.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(insanejournalHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(insanejournalHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS, Atom, and userpics feeds for journal subdomain', () => {
      const value = 'https://random.insanejournal.com'
      const expected = [
        {
          uri: 'https://random.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds regardless of path', () => {
      const value = 'https://random.insanejournal.com/123456.html'
      const expected = [
        {
          uri: 'https://random.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should add tag-filtered feeds for /tag/ paths on journal', () => {
      const value = 'https://random.insanejournal.com/tag/photography'
      const expected = [
        {
          uri: 'https://random.insanejournal.com/data/rss?tag=photography',
          hint: { key: 'insanejournal:posts-tag-rss', label: 'Tag (RSS)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/atom?tag=photography',
          hint: { key: 'insanejournal:posts-tag-atom', label: 'Tag (Atom)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://random.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.insanejournal.com/users/{user} to subdomain', () => {
      const value = 'https://www.insanejournal.com/users/news'
      const expected = [
        {
          uri: 'https://news.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://news.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://news.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should route www.insanejournal.com/asylum/{name} to asylums subdomain', () => {
      const value = 'https://www.insanejournal.com/asylum/squeaky'
      const expected = [
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/userpics',
          hint: { key: 'insanejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep asylums.insanejournal.com path-scoped feeds', () => {
      const value = 'https://asylums.insanejournal.com/squeaky'
      const expected = [
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/userpics',
          hint: { key: 'insanejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for www host without user/asylum selector', () => {
      expect(insanejournalHandler.resolve('https://www.insanejournal.com/random')).toEqual([])
    })

    it('should return empty array for asylums host without slug', () => {
      expect(insanejournalHandler.resolve('https://asylums.insanejournal.com/')).toEqual([])
    })

    it('should return empty array for feeds host without slug', () => {
      expect(insanejournalHandler.resolve('https://feeds.insanejournal.com/')).toEqual([])
    })

    it('should keep feeds.insanejournal.com path-scoped feeds', () => {
      const value = 'https://feeds.insanejournal.com/dw_code_feed'
      const expected = [
        {
          uri: 'https://feeds.insanejournal.com/dw_code_feed/data/rss',
          hint: { key: 'insanejournal:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://feeds.insanejournal.com/dw_code_feed/data/atom',
          hint: { key: 'insanejournal:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://feeds.insanejournal.com/dw_code_feed/data/userpics',
          hint: { key: 'insanejournal:userpics-atom', label: 'Userpics (Atom)' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
