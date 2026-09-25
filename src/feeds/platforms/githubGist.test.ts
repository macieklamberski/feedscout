import { describe, expect, it } from 'bun:test'
import type { GithubGistUrl } from './githubGist.js'
import { githubGistHandler, parseGithubGistUrl } from './githubGist.js'

describe('parseGithubGistUrl', () => {
  it('should return the user for a user page', () => {
    const expected: GithubGistUrl = { kind: 'user', username: 'defunkt' }

    expect(parseGithubGistUrl('https://gist.github.com/defunkt')).toEqual(expected)
  })

  it('should return the user for a gist page', () => {
    const value = 'https://gist.github.com/defunkt/1234567890abcdef'
    const expected: GithubGistUrl = { kind: 'user', username: 'defunkt' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  const listingValues: Array<string> = [
    'https://gist.github.com/defunkt/public',
    'https://gist.github.com/defunkt/secret',
  ]

  it.each(listingValues)('should return the user for %s', (value) => {
    const expected: GithubGistUrl = { kind: 'user', username: 'defunkt' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  it('should strip the feed suffix from a user feed URL', () => {
    const expected: GithubGistUrl = { kind: 'user', username: 'octocat' }

    expect(parseGithubGistUrl('https://gist.github.com/octocat.atom')).toEqual(expected)
  })

  it('should return the starred gists for a starred page', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'defunkt' }

    expect(parseGithubGistUrl('https://gist.github.com/defunkt/starred')).toEqual(expected)
  })

  it('should return the starred gists for the starred feed URL', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'defunkt' }

    expect(parseGithubGistUrl('https://gist.github.com/defunkt/starred.atom')).toEqual(expected)
  })

  const forksValues: Array<string> = [
    'https://gist.github.com/defunkt/forks',
    'https://gist.github.com/defunkt/forked',
    'https://gist.github.com/defunkt/forks/',
    'https://gist.github.com/defunkt/forked.atom',
  ]

  it.each(forksValues)('should return the forked gists for %s', (value) => {
    const expected: GithubGistUrl = { kind: 'forks', username: 'defunkt' }

    expect(parseGithubGistUrl(value)).toEqual(expected)
  })

  const excludedValues: Array<string> = [
    'https://gist.github.com/discover',
    'https://gist.github.com/search',
    'https://gist.github.com/login',
    'https://gist.github.com/join',
    'https://gist.github.com/settings',
  ]

  it.each(excludedValues)('should return undefined for %s', (value) => {
    expect(parseGithubGistUrl(value)).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseGithubGistUrl('https://gist.github.com/Discover')).toBeUndefined()
    expect(parseGithubGistUrl('https://gist.github.com/SEARCH')).toBeUndefined()
  })

  it('should return undefined for a gist under an excluded path', () => {
    const value = 'https://gist.github.com/discover/1234567890abcdef'

    expect(parseGithubGistUrl(value)).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseGithubGistUrl('https://gist.github.com/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseGithubGistUrl('https://www.gist.github.com/octocat')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGithubGistUrl('https://github.com/defunkt')).toBeUndefined()
    expect(parseGithubGistUrl('https://example.com/gist')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGithubGistUrl('not-a-url')).toBeUndefined()
  })
})

describe('githubGistHandler', () => {
  describe('match', () => {
    it('should match a Gist URL', () => {
      expect(githubGistHandler.match('https://gist.github.com/defunkt')).toBe(true)
    })

    it('should not match another host', () => {
      expect(githubGistHandler.match('https://github.com/defunkt')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return Atom feed URL for user gists page', () => {
      const value = 'https://gist.github.com/defunkt'
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt.atom',
          hint: { key: 'github-gist:gists', label: 'Gists' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    const gainedValues: Array<string> = [
      'https://gist.github.com/defunkt.atom',
      'https://gist.github.com/defunkt/public',
      'https://gist.github.com/defunkt/secret',
    ]

    it.each(gainedValues)('should return the user gists feed for %s', (value) => {
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt.atom',
          hint: { key: 'github-gist:gists', label: 'Gists' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return starred gists feed for user starred page', () => {
      const value = 'https://gist.github.com/defunkt/starred'
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt/starred.atom',
          hint: { key: 'github-gist:starred', label: 'Starred' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forked gists feed for user forks page', () => {
      const value = 'https://gist.github.com/defunkt/forks'
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt/forked.atom',
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

    it('should return empty array for excluded paths', () => {
      expect(githubGistHandler.resolve('https://gist.github.com/search')).toEqual([])
    })
  })
})
