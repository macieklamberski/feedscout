import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  it('should return the user and tag for a tag page on a www users path', () => {
    const value = 'https://www.insanejournal.com/users/jane/tag/books'
    const expected: InsanejournalUrl = { kind: 'journal', username: 'jane', tag: 'books' }

    expect(parseInsanejournalUrl(value)).toEqual(expected)
  })

  it('should return the asylum and tag for a tag page on the asylums host', () => {
    const value = 'https://asylums.insanejournal.com/club/tag/books'
    const expected: InsanejournalUrl = { kind: 'asylum', asylum: 'club', tag: 'books' }

    expect(parseInsanejournalUrl(value)).toEqual(expected)
  })

  it('should return the asylum for a www asylum path', () => {
    const expected: InsanejournalUrl = { kind: 'asylum', asylum: 'club' }

    expect(parseInsanejournalUrl('https://www.insanejournal.com/asylum/club')).toEqual(expected)
  })

  it('should return the user and tag for a www users tag page', () => {
    const value = 'https://www.insanejournal.com/users/jane/tag/books'
    const expected: InsanejournalUrl = { kind: 'journal', username: 'jane', tag: 'books' }

    expect(parseInsanejournalUrl(value)).toEqual(expected)
  })

  it('should return the user and tag for a www tilde tag page', () => {
    const value = 'https://www.insanejournal.com/~jane/tag/books'
    const expected: InsanejournalUrl = { kind: 'journal', username: 'jane', tag: 'books' }

    expect(parseInsanejournalUrl(value)).toEqual(expected)
  })

  it('should return the asylum and tag for a www asylum tag page', () => {
    const value = 'https://www.insanejournal.com/asylum/club/tag/books'
    const expected: InsanejournalUrl = { kind: 'asylum', asylum: 'club', tag: 'books' }

    expect(parseInsanejournalUrl(value)).toEqual(expected)
  })

  it('should return the asylum for an asylums host page', () => {
    const expected: InsanejournalUrl = { kind: 'asylum', asylum: 'club' }

    expect(parseInsanejournalUrl('https://asylums.insanejournal.com/club')).toEqual(expected)
  })

  it('should return the syndicated feed for a feeds host page', () => {
    const expected: InsanejournalUrl = { kind: 'syndicated', feed: 'news' }

    expect(parseInsanejournalUrl('https://feeds.insanejournal.com/news')).toEqual(expected)
  })

  it('should return the journal for a users host page', () => {
    const expected: InsanejournalUrl = { kind: 'journal', username: '_alice_' }

    expect(parseInsanejournalUrl('https://users.insanejournal.com/_alice_/')).toEqual(expected)
  })

  it('should return the journal and tag for a users host tag page', () => {
    const value = 'https://users.insanejournal.com/_alice_/tag/books'
    const expected: InsanejournalUrl = { kind: 'journal', username: '_alice_', tag: 'books' }

    expect(parseInsanejournalUrl(value)).toEqual(expected)
  })

  it('should return the asylum and tag for an asylums host tag page', () => {
    const value = 'https://asylums.insanejournal.com/club/tag/books'
    const expected: InsanejournalUrl = { kind: 'asylum', asylum: 'club', tag: 'books' }

    expect(parseInsanejournalUrl(value)).toEqual(expected)
  })

  it('should return undefined for the bare users host', () => {
    expect(parseInsanejournalUrl('https://users.insanejournal.com/')).toBeUndefined()
  })

  it('should return undefined for a dotted users host path', () => {
    expect(parseInsanejournalUrl('https://users.insanejournal.com/robots.txt')).toBeUndefined()
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
      [true, 'https://www.insanejournal.com/asylum/carol'],
      [true, 'https://www.insanejournal.com/community/carol'],
      [true, 'https://asylums.insanejournal.com/carol'],
      [true, 'https://feeds.insanejournal.com/example_feed'],
      [true, 'https://users.insanejournal.com/_bob_/'],
      [false, 'https://users.insanejournal.com/'],
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

    it('should return an empty array for an encoded path username that is no host label', () => {
      const value = 'https://www.insanejournal.com/users/a%20b'

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

    it('should add tag-filtered feeds for a tag page on a www users path', () => {
      const value = 'https://www.insanejournal.com/users/alice/tag/photography'
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
          uri: 'https://alice.insanejournal.com/data/rss?tag=caf%C3%A9',
          hint: { key: 'insanejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.insanejournal.com/data/atom?tag=caf%C3%A9',
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
      const value = 'https://www.insanejournal.com/asylum/carol'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/carol/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should route www.insanejournal.com/asylum/{name} to asylums subdomain with a capitalized asylum segment', () => {
      const value = 'https://www.insanejournal.com/Asylum/carol'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/carol/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep asylums.insanejournal.com path-scoped feeds', () => {
      const value = 'https://asylums.insanejournal.com/carol'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/carol/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should build asylum feeds over https for an http page', () => {
      const value = 'http://asylums.insanejournal.com/carol'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/carol/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://asylums.insanejournal.com/carol/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the feeds of a journal the users host serves by path', () => {
      const value = 'https://users.insanejournal.com/_alice_/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://users.insanejournal.com/_alice_/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://users.insanejournal.com/_alice_/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://users.insanejournal.com/_alice_/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should add tag-filtered feeds for a tag page on the users host', () => {
      const value = 'https://users.insanejournal.com/_alice_/tag/books'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://users.insanejournal.com/_alice_/data/rss?tag=books',
          hint: { key: 'insanejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://users.insanejournal.com/_alice_/data/atom?tag=books',
          hint: { key: 'insanejournal:posts-tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://users.insanejournal.com/_alice_/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://users.insanejournal.com/_alice_/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://users.insanejournal.com/_alice_/data/userpics',
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
      const value = 'https://feeds.insanejournal.com/example_feed'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.insanejournal.com/example_feed/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://feeds.insanejournal.com/example_feed/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://feeds.insanejournal.com/example_feed/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a feeds.insanejournal.com page', () => {
      const value = 'http://feeds.insanejournal.com/example_feed'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://feeds.insanejournal.com/example_feed/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://feeds.insanejournal.com/example_feed/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://feeds.insanejournal.com/example_feed/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a journal subdomain page', () => {
      const value = 'http://alice.insanejournal.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.insanejournal.com/data/rss',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.insanejournal.com/data/atom',
          hint: { key: 'insanejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://alice.insanejournal.com/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(insanejournalHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a journal RSS feed', () => {
      const value = 'https://alice.insanejournal.com/data/rss'
      const expected: DiscoverUriHint = {
        key: 'insanejournal:posts',
        label: 'Posts',
        format: 'rss',
      }

      expect(insanejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed on the users host', () => {
      const value = 'https://users.insanejournal.com/_alice_/data/atom?tag=dvd+sets'
      const expected: DiscoverUriHint = {
        key: 'insanejournal:posts-tag',
        label: 'Tag',
        format: 'atom',
      }

      expect(insanejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed path at the root of the asylums host', () => {
      const value = 'https://asylums.insanejournal.com/data/rss'

      expect(insanejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path at the root of the feeds host', () => {
      const value = 'https://feeds.insanejournal.com/data/rss'

      expect(insanejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a dotted users host segment', () => {
      const value = 'https://users.insanejournal.com/robots.txt/data/rss'

      expect(insanejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed under a journal with www before the asylums host', () => {
      const value = 'https://www.asylums.insanejournal.com/example/data/rss'

      expect(insanejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not-a-url'

      expect(insanejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a userpics feed on the asylums host as itself', async () => {
      const value = 'https://asylums.insanejournal.com/07example/data/userpics'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://asylums.insanejournal.com/07example/data/userpics',
          hint: { key: 'insanejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]
      const entries = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [insanejournalHandler],
        baseUrl: value,
      })

      expect(entries).toEqual(expected)
    })
  })
})
