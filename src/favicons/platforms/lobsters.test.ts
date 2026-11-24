import { describe, expect, it } from 'bun:test'
import { type LobstersUrl, lobstersHandler, parseLobstersUrl } from './lobsters.js'

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

  it('should return undefined for the www host', () => {
    expect(parseLobstersUrl('https://www.lobste.rs/~alice')).toBeUndefined()
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
    it('should match user URLs', () => {
      expect(lobstersHandler.match('https://lobste.rs/~alice')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(lobstersHandler.match('https://lobste.rs/t/programming')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected = [{ uri: 'https://lobste.rs/avatars/alice-100.png' }]

      expect(lobstersHandler.resolve('https://lobste.rs/~alice')).toEqual(expected)
    })

    it('should return empty array for non-user path', () => {
      expect(lobstersHandler.resolve('https://lobste.rs/t/programming')).toEqual([])
    })
  })
})
