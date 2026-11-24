import { describe, expect, it } from 'bun:test'
import { type GithubGistUrl, githubGistHandler, parseGithubGistUrl } from './githubGist.js'

describe('parseGithubGistUrl', () => {
  it('should return the user for a user page', () => {
    const expected: GithubGistUrl = { kind: 'user', username: 'alice' }

    expect(parseGithubGistUrl('https://gist.github.com/alice')).toEqual(expected)
  })

  it('should return the user for a gist page', () => {
    const value = 'https://gist.github.com/alice/1234567890abcdef'
    const expected: GithubGistUrl = { kind: 'user', username: 'alice' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  const listingValues: Array<string> = [
    'https://gist.github.com/alice/public',
    'https://gist.github.com/alice/secret',
  ]

  it.each(listingValues)('should return the user for %s', (value) => {
    const expected: GithubGistUrl = { kind: 'user', username: 'alice' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  it('should strip the feed suffix from a user feed URL', () => {
    const value = 'https://gist.github.com/alice.atom'
    const expected: GithubGistUrl = { kind: 'user', username: 'alice' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  it('should return the discover page for the discover feed URL', () => {
    const value = 'https://gist.github.com/discover.atom'
    const expected: GithubGistUrl = { kind: 'discover' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  it('should return the starred gists for a starred page', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'alice' }

    expect(parseGithubGistUrl('https://gist.github.com/alice/starred')).toEqual(expected)
  })

  it('should return the starred gists for a starred page with a capitalized starred segment', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'alice' }

    expect(parseGithubGistUrl('https://gist.github.com/alice/Starred')).toEqual(expected)
  })

  const forksValues: Array<string> = [
    'https://gist.github.com/alice/forks',
    'https://gist.github.com/alice/forked',
    'https://gist.github.com/alice/forks/',
    'https://gist.github.com/alice/Forks',
  ]

  it.each(forksValues)('should return the forked gists for %s', (value) => {
    const expected: GithubGistUrl = { kind: 'forks', username: 'alice' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseGithubGistUrl('https://gist.github.com/robots.txt')).toBeUndefined()
  })

  it('should return the discover page', () => {
    const expected: GithubGistUrl = { kind: 'discover' }

    expect(parseGithubGistUrl('https://gist.github.com/Discover/')).toEqual(expected)
  })

  it('should return undefined for the homepage', () => {
    expect(parseGithubGistUrl('https://gist.github.com/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseGithubGistUrl('https://www.gist.github.com/octocat')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGithubGistUrl('https://github.com/alice')).toBeUndefined()
    expect(parseGithubGistUrl('https://example.com/gist')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGithubGistUrl('not-a-url')).toBeUndefined()
  })
})

describe('githubGistHandler', () => {
  describe('match', () => {
    it('should match a user page', () => {
      expect(githubGistHandler.match('https://gist.github.com/octocat')).toBe(true)
    })

    it('should not match the discover feed URL', () => {
      const value = 'https://gist.github.com/discover.atom'

      expect(githubGistHandler.match(value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubGistHandler.resolve('https://gist.github.com/octocat')).toEqual(expected)
    })

    it('should resolve user avatar from starred URL', () => {
      const expected = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubGistHandler.resolve('https://gist.github.com/octocat/starred')).toEqual(expected)
    })

    it('should resolve user avatar from a user feed URL', () => {
      const value = 'https://gist.github.com/alice.atom'
      const expected = [{ uri: 'https://github.com/alice.png' }]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })
  })
})
