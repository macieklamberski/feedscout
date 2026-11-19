import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gist.github.com/alice.atom',
          hint: { key: 'github-gist:gists', label: 'Gists' },
        },
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: { key: 'github-gist:discover', label: 'Discover' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    const gainedValues: Array<string> = [
      'https://gist.github.com/alice/public',
      'https://gist.github.com/alice/secret',
    ]

    it.each(gainedValues)('should return the user gists feed for %s', (value) => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gist.github.com/alice.atom',
          hint: { key: 'github-gist:gists', label: 'Gists' },
        },
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: { key: 'github-gist:discover', label: 'Discover' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return starred gists feed for user starred page', () => {
      const value = 'https://gist.github.com/alice/starred'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gist.github.com/alice/starred.atom',
          hint: { key: 'github-gist:starred', label: 'Starred' },
        },
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: { key: 'github-gist:discover', label: 'Discover' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forked gists feed for user forks page', () => {
      const value = 'https://gist.github.com/alice/forks'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gist.github.com/alice/forked.atom',
          hint: { key: 'github-gist:forks', label: 'Forks' },
        },
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: { key: 'github-gist:discover', label: 'Discover' },
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

    it('should return nothing for the homepage', () => {
      const value = 'https://gist.github.com/'
      const expected: Array<DiscoverUriEntry> = []

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the gists hint for the forks path the site serves as the user gists', () => {
      const value = 'https://gist.github.com/alice/forks.atom'
      const expected: DiscoverUriHint = { key: 'github-gist:gists', label: 'Gists' }

      expect(githubGistHandler.getFeedHint?.(value)).toEqual(expected)
    })

    const discoverValues: Array<string> = [
      'https://gist.github.com/discover/starred.atom',
      'https://gist.github.com/Discover/forked.atom',
      'https://gist.github.com/discover/forks.atom',
    ]

    it.each(discoverValues)('should return undefined for %s', (value) => {
      expect(githubGistHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a dotted name', () => {
      const value = 'https://gist.github.com/alice.example.atom'

      expect(githubGistHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it('should return a starred feed as given', async () => {
      const value = 'https://gist.github.com/alice/starred.atom'
      const options = {
        ...defaultPlatformOptions,
        handlers: [githubGistHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://gist.github.com/alice/starred.atom',
          hint: { key: 'github-gist:starred', label: 'Starred' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
