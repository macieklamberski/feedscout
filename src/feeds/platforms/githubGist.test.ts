import { describe, expect, it } from 'bun:test'
import type { GithubGistUrl } from './githubGist.js'
import { githubGistHandler, parseGithubGistUrl } from './githubGist.js'

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
    const expected: GithubGistUrl = { kind: 'user', username: 'octocat' }

    expect(parseGithubGistUrl('https://gist.github.com/octocat.atom')).toEqual(expected)
  })

  it('should return the starred gists for a starred page', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'alice' }

    expect(parseGithubGistUrl('https://gist.github.com/alice/starred')).toEqual(expected)
  })

  it('should return the starred gists for a starred page with a capitalized starred segment', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'alice' }

    expect(parseGithubGistUrl('https://gist.github.com/alice/Starred')).toEqual(expected)
  })

  it('should return the starred gists for the starred feed URL', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'alice' }

    expect(parseGithubGistUrl('https://gist.github.com/alice/starred.atom')).toEqual(expected)
  })

  it('should return the starred gists for a capitalized starred feed suffix', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'alice' }

    expect(parseGithubGistUrl('https://gist.github.com/alice/starred.ATOM')).toEqual(expected)
  })

  const forksValues: Array<string> = [
    'https://gist.github.com/alice/forks',
    'https://gist.github.com/alice/forked',
    'https://gist.github.com/alice/forks/',
    'https://gist.github.com/alice/forked.atom',
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
    it('should match a Gist URL', () => {
      expect(githubGistHandler.match('https://gist.github.com/alice')).toBe(true)
    })

    it('should not match another host', () => {
      expect(githubGistHandler.match('https://github.com/alice')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return Atom feed URL for user gists page', () => {
      const value = 'https://gist.github.com/alice'
      const expected = [
        {
          uri: 'https://gist.github.com/alice.atom',
          hint: { key: 'github-gist:gists', label: 'Gists' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    const gainedValues: Array<string> = [
      'https://gist.github.com/alice.atom',
      'https://gist.github.com/alice/public',
      'https://gist.github.com/alice/secret',
    ]

    it.each(gainedValues)('should return the user gists feed for %s', (value) => {
      const expected = [
        {
          uri: 'https://gist.github.com/alice.atom',
          hint: { key: 'github-gist:gists', label: 'Gists' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return starred gists feed for user starred page', () => {
      const value = 'https://gist.github.com/alice/starred'
      const expected = [
        {
          uri: 'https://gist.github.com/alice/starred.atom',
          hint: { key: 'github-gist:starred', label: 'Starred' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forked gists feed for user forks page', () => {
      const value = 'https://gist.github.com/alice/forks'
      const expected = [
        {
          uri: 'https://gist.github.com/alice/forked.atom',
          hint: { key: 'github-gist:forks', label: 'Forks' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return discover feed for discover page', () => {
      const value = 'https://gist.github.com/discover'
      const expected = [
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: { key: 'github-gist:discover', label: 'Discover' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return discover feed for discover page with a capitalized discover segment', () => {
      const value = 'https://gist.github.com/Discover'
      const expected = [
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: { key: 'github-gist:discover', label: 'Discover' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return discover feed with trailing slash', () => {
      const value = 'https://gist.github.com/discover/'
      const expected = [
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: { key: 'github-gist:discover', label: 'Discover' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })
  })
})
