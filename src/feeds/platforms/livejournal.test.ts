import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type LivejournalUrl, livejournalHandler, parseLivejournalUrl } from './livejournal.js'

describe('parseLivejournalUrl', () => {
  it('should return the journal for a journal subdomain', () => {
    const expected: LivejournalUrl = { kind: 'journal' }

    expect(parseLivejournalUrl('https://example.livejournal.com/')).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const expected: LivejournalUrl = { kind: 'journal', tag: 'books' }

    expect(parseLivejournalUrl('https://example.livejournal.com/tag/books')).toEqual(expected)
  })

  it('should return the user for a www users path', () => {
    const expected: LivejournalUrl = { kind: 'journal', username: 'news' }

    expect(parseLivejournalUrl('https://www.livejournal.com/users/news')).toEqual(expected)
  })

  it('should return the user for a legacy users host page', () => {
    const expected: LivejournalUrl = { kind: 'journal', username: 'news' }

    expect(parseLivejournalUrl('https://users.livejournal.com/news')).toEqual(expected)
  })

  it('should return the journal of a user named static', () => {
    const expected: LivejournalUrl = { kind: 'journal' }

    expect(parseLivejournalUrl('https://static.livejournal.com/')).toEqual(expected)
  })

  it('should return undefined for the mobile host', () => {
    expect(parseLivejournalUrl('https://m.livejournal.com/read/user/someuser/')).toBeUndefined()
  })

  it('should return undefined for the syndication host', () => {
    expect(parseLivejournalUrl('https://syndicated.livejournal.com/somefeed/')).toBeUndefined()
  })

  it('should return undefined for a dotted www users path', () => {
    expect(parseLivejournalUrl('https://www.livejournal.com/users/robots.txt')).toBeUndefined()
  })

  it('should return undefined for a dotted legacy users host path', () => {
    expect(parseLivejournalUrl('https://users.livejournal.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseLivejournalUrl('https://example.com/')).toBeUndefined()
  })
})

describe('livejournalHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.livejournal.com'],
      [false, 'https://blog.example.livejournal.com'],
      [true, 'https://www.livejournal.com/users/bob'],
      [true, 'https://www.livejournal.com/~bob'],
      [true, 'https://users.livejournal.com/bob'],
      [true, 'https://community.livejournal.com/alice'],
      [false, 'https://www.livejournal.com'],
      [false, 'https://users.livejournal.com'],
      [false, 'https://community.livejournal.com'],
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
    it('should return an empty array for a path username that is no host label', () => {
      const value = 'https://www.livejournal.com/~..'

      expect(livejournalHandler.resolve(value)).toEqual([])
    })

    it('should return an empty array for a path username with an encoded space', () => {
      const value = 'https://www.livejournal.com/users/john%20smith/'

      expect(livejournalHandler.resolve(value)).toEqual([])
    })

    it('should write an underscore in a path username as a hyphen in the host', async () => {
      const value = 'https://www.livejournal.com/users/foo_bar/'

      const [first] = await livejournalHandler.resolve(value)

      expect(first).toEqual({
        uri: 'https://foo-bar.livejournal.com/data/rss',
        hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
      })
    })

    it('should keep a username with an edge underscore on the users host', async () => {
      const value = 'https://users.livejournal.com/_foo_/'

      const [first] = await livejournalHandler.resolve(value)

      expect(first).toEqual({
        uri: 'https://users.livejournal.com/-foo-/data/rss',
        hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
      })
    })

    it('should return empty array for a URL outside LiveJournal', () => {
      expect(livejournalHandler.resolve('https://example.com/')).toEqual([])
    })

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
          uri: 'https://alice.livejournal.com/data/rss?tag=café',
          hint: { key: 'livejournal:posts-tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.livejournal.com/data/atom?tag=café',
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

    it('should keep the http scheme of a journal subdomain page', () => {
      const value = 'http://deni-didro.livejournal.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://deni-didro.livejournal.com/data/rss',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://deni-didro.livejournal.com/data/atom',
          hint: { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://deni-didro.livejournal.com/data/userpics',
          hint: { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
        },
      ]

      expect(livejournalHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for an RSS feed', () => {
      const value = 'https://deni-didro.livejournal.com/data/rss'
      const expected: DiscoverUriHint = { key: 'livejournal:posts', label: 'Posts', format: 'rss' }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed', () => {
      const value = 'https://dyork.livejournal.com/data/atom'
      const expected: DiscoverUriHint = { key: 'livejournal:posts', label: 'Posts', format: 'atom' }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RSS feed with a trailing slash', () => {
      const value = 'https://lleo.livejournal.com/data/rss/'
      const expected: DiscoverUriHint = { key: 'livejournal:posts', label: 'Posts', format: 'rss' }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RSS feed over http', () => {
      const value = 'http://deni-didro.livejournal.com/data/rss'
      const expected: DiscoverUriHint = { key: 'livejournal:posts', label: 'Posts', format: 'rss' }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the userpics hint for a userpics feed', () => {
      const value = 'https://deni-didro.livejournal.com/data/userpics'
      const expected: DiscoverUriHint = {
        key: 'livejournal:userpics',
        label: 'Userpics',
        format: 'atom',
      }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://mrpet.livejournal.com/data/rss?tag=djpet'
      const expected: DiscoverUriHint = {
        key: 'livejournal:posts-tag',
        label: 'Tag',
        format: 'rss',
      }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed on the users host', () => {
      const value = 'https://users.livejournal.com/-volta-/data/rss'
      const expected: DiscoverUriHint = { key: 'livejournal:posts', label: 'Posts', format: 'rss' }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed on the users host', () => {
      const value = 'https://users.livejournal.com/-adanel-/data/atom'
      const expected: DiscoverUriHint = { key: 'livejournal:posts', label: 'Posts', format: 'atom' }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a percent-encoded tag feed on the users host', () => {
      const value =
        'https://users.livejournal.com/-volta-/data/rss?tag=%D1%84%D0%B8%D0%BB%D1%8C%D0%BC%D1%8B'
      const expected: DiscoverUriHint = {
        key: 'livejournal:posts-tag',
        label: 'Tag',
        format: 'rss',
      }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed on the community host', () => {
      const value =
        'https://community.livejournal.com/-imitatinglife/data/rss?tag=title%3A+the+consequences+of+falling'
      const expected: DiscoverUriHint = {
        key: 'livejournal:posts-tag',
        label: 'Tag',
        format: 'rss',
      }

      expect(livejournalHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a journal page', () => {
      const value = 'https://deni-didro.livejournal.com/'

      expect(livejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://mrpet.livejournal.com/tag/djpet'

      expect(livejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the mobile host', () => {
      const value = 'https://m.livejournal.com/data/rss'

      expect(livejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a dotted users host segment', () => {
      const value = 'https://users.livejournal.com/robots.txt/data/rss'

      expect(livejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested image host', () => {
      const value = 'https://ic.pics.livejournal.com/data/rss'

      expect(livejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the www host', () => {
      const value = 'https://www.livejournal.com/data/rss'

      expect(livejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/data/rss'

      expect(livejournalHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://deni-didro.livejournal.com/data/rss',
        { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://dyork.livejournal.com/data/atom',
        { key: 'livejournal:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://lleo.livejournal.com/data/rss/',
        { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://deni-didro.livejournal.com/data/userpics',
        { key: 'livejournal:userpics', label: 'Userpics', format: 'atom' },
      ],
      [
        'https://mrpet.livejournal.com/data/rss?tag=djpet',
        { key: 'livejournal:posts-tag', label: 'Tag', format: 'rss' },
      ],
      [
        'https://users.livejournal.com/-volta-/data/rss',
        { key: 'livejournal:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://users.livejournal.com/--marcelo/data/atom?tag=herzog',
        { key: 'livejournal:posts-tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://community.livejournal.com/-imitatinglife/data/rss?tag=title%3A+the+consequences+of+falling',
        { key: 'livejournal:posts-tag', label: 'Tag', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [livejournalHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
