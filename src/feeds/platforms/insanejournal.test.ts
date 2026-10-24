import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  type InsanejournalUrl,
  insanejournalHandler,
  parseInsanejournalUrl,
} from './insanejournal.js'

describe('parseInsanejournalUrl', () => {
  it('should return the journal for a journal subdomain', () => {
    const expected: InsanejournalUrl = { kind: 'journal' }

    expect(parseInsanejournalUrl('https://example.insanejournal.com/')).toEqual(expected)
  })

  it('should return the user for a www users path', () => {
    const expected: InsanejournalUrl = { kind: 'journal', username: 'jane' }

    expect(parseInsanejournalUrl('https://www.insanejournal.com/users/jane')).toEqual(expected)
  })

  it('should return the asylum for a www asylum path', () => {
    const expected: InsanejournalUrl = { kind: 'asylum', asylum: 'club' }

    expect(parseInsanejournalUrl('https://www.insanejournal.com/asylum/club')).toEqual(expected)
  })

  it('should return the asylum for an asylums host page', () => {
    const expected: InsanejournalUrl = { kind: 'asylum', asylum: 'club' }

    expect(parseInsanejournalUrl('https://asylums.insanejournal.com/club')).toEqual(expected)
  })

  it('should return the syndicated feed for a feeds host page', () => {
    const expected: InsanejournalUrl = { kind: 'syndicated', feed: 'news' }

    expect(parseInsanejournalUrl('https://feeds.insanejournal.com/news')).toEqual(expected)
  })

  it('should return undefined for the bare www host', () => {
    expect(parseInsanejournalUrl('https://www.insanejournal.com/')).toBeUndefined()
  })

  it('should return undefined for a dotted www users path', () => {
    expect(parseInsanejournalUrl('https://www.insanejournal.com/users/robots.txt')).toBeUndefined()
  })

  it('should return undefined for a dotted www asylum path', () => {
    expect(parseInsanejournalUrl('https://www.insanejournal.com/asylum/robots.txt')).toBeUndefined()
  })

  it('should return undefined for a dotted asylums host path', () => {
    expect(parseInsanejournalUrl('https://asylums.insanejournal.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for a dotted feeds host path', () => {
    expect(parseInsanejournalUrl('https://feeds.insanejournal.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseInsanejournalUrl('https://example.com/')).toBeUndefined()
  })
})

describe('insanejournalHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.insanejournal.com'],
      [true, 'https://anything.insanejournal.com/post'],
      [false, 'https://www.alice.insanejournal.com'],
      [true, 'https://www.insanejournal.com/users/bob'],
      [true, 'https://insanejournal.com/users/bob'],
      [true, 'https://www.insanejournal.com/~bob'],
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
    it('should return an empty array for a path username that is no host label', () => {
      const value = 'https://www.insanejournal.com/~..'

      expect(insanejournalHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for a URL outside InsaneJournal', () => {
      expect(insanejournalHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS, Atom, and userpics feeds for journal subdomain', () => {
      const value = 'https://alice.insanejournal.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds regardless of path', () => {
      const value = 'https://alice.insanejournal.com/123456.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should add tag-filtered feeds for /tag/ paths on journal', () => {
      const value = 'https://alice.insanejournal.com/tag/photography'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.insanejournal.com/data/rss?tag=photography',
          hint: { key: 'insanejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/atom?tag=photography',
          hint: { key: 'insanejournal:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a percent-encoded tag encoded once', () => {
      const value = 'https://alice.insanejournal.com/tag/caf%C3%A9'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.insanejournal.com/data/rss?tag=café',
          hint: { key: 'insanejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/atom?tag=café',
          hint: { key: 'insanejournal:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.insanejournal.com/users/{user} to subdomain', () => {
      const value = 'https://www.insanejournal.com/users/bob'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://bob.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should canonicalise www.insanejournal.com/users/{user} to subdomain with a capitalized users segment', () => {
      const value = 'https://www.insanejournal.com/Users/bob'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bob.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://bob.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://bob.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should route www.insanejournal.com/asylum/{name} to asylums subdomain', () => {
      const value = 'https://www.insanejournal.com/asylum/squeaky'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should route www.insanejournal.com/asylum/{name} to asylums subdomain with a capitalized asylum segment', () => {
      const value = 'https://www.insanejournal.com/Asylum/squeaky'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep asylums.insanejournal.com path-scoped feeds', () => {
      const value = 'https://asylums.insanejournal.com/squeaky'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should build asylum feeds over https for an http page', () => {
      const value = 'http://asylums.insanejournal.com/squeaky'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/squeaky/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
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
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.insanejournal.com/dw_code_feed/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://feeds.insanejournal.com/dw_code_feed/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://feeds.insanejournal.com/dw_code_feed/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })
  })
})
