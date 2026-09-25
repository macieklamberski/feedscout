import { describe, expect, it } from 'bun:test'
import type { LobstersUrl } from './lobsters.js'
import { lobstersHandler, parseLobstersUrl } from './lobsters.js'

describe('parseLobstersUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: LobstersUrl = { kind: 'tag', tags: 'programming' }

    expect(parseLobstersUrl('https://lobste.rs/t/programming')).toEqual(expected)
  })

  it('should return every tag for a multiple tags page', () => {
    const expected: LobstersUrl = { kind: 'tag', tags: 'programming,security' }

    expect(parseLobstersUrl('https://lobste.rs/t/programming,security')).toEqual(expected)
  })

  it('should return the domain for a domain page', () => {
    const expected: LobstersUrl = { kind: 'domain', domain: 'github.com' }

    expect(parseLobstersUrl('https://lobste.rs/domains/github.com')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'jcs' }

    expect(parseLobstersUrl('https://lobste.rs/~jcs')).toEqual(expected)
  })

  it('should return the user for a user page with a trailing slash', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'pushcx' }

    expect(parseLobstersUrl('https://lobste.rs/~pushcx/')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'pushcx' }

    expect(parseLobstersUrl('https://lobste.rs/~pushcx/stories')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: LobstersUrl = { kind: 'user', username: 'PushCX' }

    expect(parseLobstersUrl('https://lobste.rs/~PushCX')).toEqual(expected)
  })

  it('should return undefined for the site-wide top page', () => {
    expect(parseLobstersUrl('https://lobste.rs/top/1d')).toBeUndefined()
  })

  it('should return undefined for a username with an @ character', () => {
    expect(parseLobstersUrl('https://lobste.rs/~@invalid')).toBeUndefined()
  })

  it('should return undefined for the newest and comments pages', () => {
    expect(parseLobstersUrl('https://lobste.rs/newest')).toBeUndefined()
    expect(parseLobstersUrl('https://lobste.rs/comments')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseLobstersUrl('https://lobste.rs')).toBeUndefined()
    expect(parseLobstersUrl('https://lobste.rs/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseLobstersUrl('https://www.lobste.rs/~jcs')).toBeUndefined()
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
    it('should return main RSS feed for homepage', () => {
      const value = 'https://lobste.rs/'
      const expected = [
        { uri: 'https://lobste.rs/rss', hint: { key: 'lobsters:stories', label: 'Stories' } },
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: { key: 'lobsters:comments', label: 'Comments' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return newest RSS feed for newest page', () => {
      const value = 'https://lobste.rs/newest'
      const expected = [
        { uri: 'https://lobste.rs/newest.rss', hint: { key: 'lobsters:newest', label: 'Newest' } },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag RSS feed for single tag page', () => {
      const value = 'https://lobste.rs/t/programming'
      const expected = [
        { uri: 'https://lobste.rs/t/programming.rss', hint: { key: 'lobsters:tag', label: 'Tag' } },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return domain RSS feed for domain page', () => {
      const value = 'https://lobste.rs/domains/github.com'
      const expected = [
        {
          uri: 'https://lobste.rs/domains/github.com.rss',
          hint: { key: 'lobsters:domain', label: 'Domain' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return user stories feed for user page', () => {
      const value = 'https://lobste.rs/~pushcx'
      const expected = [
        {
          uri: 'https://lobste.rs/~pushcx/stories.rss',
          hint: { key: 'lobsters:stories', label: 'Stories' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return top stories feed for top page', () => {
      const value = 'https://lobste.rs/top'
      const expected = [
        { uri: 'https://lobste.rs/top/rss', hint: { key: 'lobsters:top', label: 'Top stories' } },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return top stories feed with period', () => {
      const value = 'https://lobste.rs/top/1d'
      const expected = [
        {
          uri: 'https://lobste.rs/top/1d/rss',
          hint: { key: 'lobsters:top', label: 'Top stories' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    const topPeriodValues: Array<[string, string]> = [
      ['https://lobste.rs/top/3d', 'https://lobste.rs/top/3d/rss'],
      ['https://lobste.rs/top/1w', 'https://lobste.rs/top/1w/rss'],
      ['https://lobste.rs/top/1m', 'https://lobste.rs/top/1m/rss'],
      ['https://lobste.rs/top/1y', 'https://lobste.rs/top/1y/rss'],
    ]

    it.each(topPeriodValues)('should return top stories feed for %s', (value, uri) => {
      const expected = [{ uri, hint: { key: 'lobsters:top', label: 'Top stories' } }]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return comments feed for comments page', () => {
      const value = 'https://lobste.rs/comments'
      const expected = [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: { key: 'lobsters:comments', label: 'Comments' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })
  })
})
