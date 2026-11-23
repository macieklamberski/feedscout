import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { LobstersUrl } from './lobsters.js'
import { lobstersHandler, parseLobstersUrl } from './lobsters.js'

describe('parseLobstersUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: LobstersUrl = { kind: 'tag', tags: 'programming' }

    expect(parseLobstersUrl('https://lobste.rs/t/programming')).toEqual(expected)
  })

  it('should return the tag for a tag page with a capitalized t segment', () => {
    const expected: LobstersUrl = { kind: 'tag', tags: 'programming' }

    expect(parseLobstersUrl('https://lobste.rs/T/programming')).toEqual(expected)
  })

  it('should return every tag for a multiple tags page', () => {
    const expected: LobstersUrl = { kind: 'tag', tags: 'programming,security' }

    expect(parseLobstersUrl('https://lobste.rs/t/programming,security')).toEqual(expected)
  })

  it('should return the domain for a domain page', () => {
    const expected: LobstersUrl = { kind: 'domain', domain: 'example.com' }

    expect(parseLobstersUrl('https://lobste.rs/domains/example.com')).toEqual(expected)
  })

  it('should return the domain for a domain page with a capitalized domains segment', () => {
    const expected: LobstersUrl = { kind: 'domain', domain: 'example.com' }

    expect(parseLobstersUrl('https://lobste.rs/Domains/example.com')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'alice' }

    expect(parseLobstersUrl('https://lobste.rs/~alice')).toEqual(expected)
  })

  it('should return the user for a user page with a trailing slash', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'bob' }

    expect(parseLobstersUrl('https://lobste.rs/~bob/')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'bob' }

    expect(parseLobstersUrl('https://lobste.rs/~bob/stories')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'Bob' }

    expect(parseLobstersUrl('https://lobste.rs/~Bob')).toEqual(expected)
  })

  it('should return the top page with its period', () => {
    const expected: LobstersUrl = { kind: 'top', period: '1d' }

    expect(parseLobstersUrl('https://lobste.rs/top/1d')).toEqual(expected)
  })

  it('should return the top page without a period', () => {
    const expected: LobstersUrl = { kind: 'top', period: undefined }

    expect(parseLobstersUrl('https://lobste.rs/top')).toEqual(expected)
  })

  it('should return the top page with a period outside the linked ones', () => {
    const expected: LobstersUrl = { kind: 'top', period: '2y' }

    expect(parseLobstersUrl('https://lobste.rs/top/2y')).toEqual(expected)
  })

  it('should return the home page for a username with an @ character', () => {
    const expected: LobstersUrl = { kind: 'home' }

    expect(parseLobstersUrl('https://lobste.rs/~@invalid')).toEqual(expected)
  })

  it('should return a one-letter tag whole', () => {
    const expected: LobstersUrl = { kind: 'tag', tags: 'a' }

    expect(parseLobstersUrl('https://lobste.rs/t/a')).toEqual(expected)
  })

  it('should return the home page for a tag with a dot', () => {
    const expected: LobstersUrl = { kind: 'home' }

    expect(parseLobstersUrl('https://lobste.rs/t/rust.lang')).toEqual(expected)
  })

  it('should return a one-letter username whole', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'a' }

    expect(parseLobstersUrl('https://lobste.rs/~a')).toEqual(expected)
  })

  it('should return the home page for a username with a dot', () => {
    const expected: LobstersUrl = { kind: 'home' }

    expect(parseLobstersUrl('https://lobste.rs/~alice.old')).toEqual(expected)
  })

  it('should return the newest page', () => {
    const expected: LobstersUrl = { kind: 'newest' }

    expect(parseLobstersUrl('https://lobste.rs/newest')).toEqual(expected)
  })

  it('should return the comments page', () => {
    const expected: LobstersUrl = { kind: 'comments' }

    expect(parseLobstersUrl('https://lobste.rs/comments')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: LobstersUrl = { kind: 'home' }

    expect(parseLobstersUrl('https://lobste.rs/')).toEqual(expected)
  })

  it('should return the home page for a path the handler does not recognise', () => {
    const expected: LobstersUrl = { kind: 'home' }

    expect(parseLobstersUrl('https://lobste.rs/s/abc123/some_story')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseLobstersUrl('https://example.com/~user')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseLobstersUrl('not-a-url')).toBeUndefined()
  })
})

describe('lobstersHandler', () => {
  describe('match', () => {
    it('should match a Lobsters URL', () => {
      expect(lobstersHandler.match('https://lobste.rs/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(lobstersHandler.match('https://example.com/lobsters')).toBe(false)
    })
  })

  describe('resolve', () => {
    const storiesFeed: DiscoverUriEntry = {
      uri: 'https://lobste.rs/rss',
      hint: { key: 'lobsters:stories', label: 'Stories' },
    }
    const newestFeed: DiscoverUriEntry = {
      uri: 'https://lobste.rs/newest.rss',
      hint: { key: 'lobsters:newest', label: 'Newest' },
    }
    const commentsFeed: DiscoverUriEntry = {
      uri: 'https://lobste.rs/comments.rss',
      hint: { key: 'lobsters:comments', label: 'Comments' },
    }

    it('should return empty array for a URL outside Lobsters', () => {
      expect(lobstersHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return main RSS feed for homepage', () => {
      const value = 'https://lobste.rs/'
      const expected = [storiesFeed, newestFeed, commentsFeed]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return newest RSS feed for newest page', () => {
      const value = 'https://lobste.rs/newest'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://lobste.rs/newest.rss', hint: { key: 'lobsters:newest', label: 'Newest' } },
        storiesFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return newest RSS feed for newest page with trailing slash', () => {
      const value = 'https://lobste.rs/newest/'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://lobste.rs/newest.rss', hint: { key: 'lobsters:newest', label: 'Newest' } },
        storiesFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return newest RSS feed for newest page with a capitalized newest segment', () => {
      const value = 'https://lobste.rs/Newest'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://lobste.rs/newest.rss', hint: { key: 'lobsters:newest', label: 'Newest' } },
        storiesFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag RSS feed for single tag page', () => {
      const value = 'https://lobste.rs/t/programming'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://lobste.rs/t/programming.rss', hint: { key: 'lobsters:tag', label: 'Tag' } },
        storiesFeed,
        newestFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return domain RSS feed for domain page', () => {
      const value = 'https://lobste.rs/domains/example.com'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lobste.rs/domains/example.com.rss',
          hint: { key: 'lobsters:domain', label: 'Domain' },
        },
        storiesFeed,
        newestFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return user stories feed for user page', () => {
      const value = 'https://lobste.rs/~bob'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lobste.rs/~bob/stories.rss',
          hint: { key: 'lobsters:user-stories', label: 'User stories' },
        },
        storiesFeed,
        newestFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return top stories feed for top page', () => {
      const value = 'https://lobste.rs/top'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lobste.rs/top/1w.rss',
          hint: { key: 'lobsters:top', label: 'Top stories' },
        },
        storiesFeed,
        newestFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return top stories feed with period', () => {
      const value = 'https://lobste.rs/top/1d'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lobste.rs/top/1d.rss',
          hint: { key: 'lobsters:top', label: 'Top stories' },
        },
        storiesFeed,
        newestFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    const topPeriodValues: Array<[string, string]> = [
      ['https://lobste.rs/top/3d', 'https://lobste.rs/top/3d.rss'],
      ['https://lobste.rs/top/1w', 'https://lobste.rs/top/1w.rss'],
      ['https://lobste.rs/top/1m', 'https://lobste.rs/top/1m.rss'],
      ['https://lobste.rs/top/1y', 'https://lobste.rs/top/1y.rss'],
    ]

    it.each(topPeriodValues)('should return top stories feed for %s', (value, uri) => {
      const expected: Array<DiscoverUriEntry> = [
        { uri, hint: { key: 'lobsters:top', label: 'Top stories' } },
        storiesFeed,
        newestFeed,
        commentsFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return comments feed for comments page', () => {
      const value = 'https://lobste.rs/comments'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: { key: 'lobsters:comments', label: 'Comments' },
        },
        storiesFeed,
        newestFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return comments feed for comments page with trailing slash', () => {
      const value = 'https://lobste.rs/comments/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: { key: 'lobsters:comments', label: 'Comments' },
        },
        storiesFeed,
        newestFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return comments feed for comments page with a capitalized comments segment', () => {
      const value = 'https://lobste.rs/Comments'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: { key: 'lobsters:comments', label: 'Comments' },
        },
        storiesFeed,
        newestFeed,
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the top hint for a top feed with its period', () => {
      const value = 'https://lobste.rs/top/1w/rss'
      const expected: DiscoverUriHint = { key: 'lobsters:top', label: 'Top stories' }

      expect(lobstersHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a private feed on the www host over http as itself', async () => {
      const value = 'http://www.lobste.rs/rss?token=abc123'
      const options = {
        ...defaultPlatformOptions,
        handlers: [lobstersHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.lobste.rs/rss?token=abc123',
          hint: { key: 'lobsters:private', label: 'Private feed' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
