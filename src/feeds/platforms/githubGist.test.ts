import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { GithubGistUrl } from './githubGist.js'
import { githubGistHandler, parseGithubGistUrl } from './githubGist.js'

const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://gist.github.com/alice.atom', { key: 'github-gist:gists', label: 'Gists' }],
  ['http://gist.github.com/alice.atom', { key: 'github-gist:gists', label: 'Gists' }],
  ['https://gist.github.com/alice/starred.atom', { key: 'github-gist:starred', label: 'Starred' }],
  ['http://gist.github.com/alice/starred.atom', { key: 'github-gist:starred', label: 'Starred' }],
  ['https://gist.github.com/alice/forked.atom', { key: 'github-gist:forks', label: 'Forks' }],
  ['http://gist.github.com/alice/forked.atom', { key: 'github-gist:forks', label: 'Forks' }],
  ['https://gist.github.com/discover.atom', { key: 'github-gist:discover', label: 'Discover' }],
  ['http://gist.github.com/discover.atom', { key: 'github-gist:discover', label: 'Discover' }],
]

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

  it('should return the starred gists for a starred page', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'defunkt' }

    expect(parseGithubGistUrl('https://gist.github.com/defunkt/starred')).toEqual(expected)
  })

  it('should return the starred gists for a starred page with a capitalized starred segment', () => {
    const expected: GithubGistUrl = { kind: 'starred', username: 'defunkt' }

    expect(parseGithubGistUrl('https://gist.github.com/defunkt/Starred')).toEqual(expected)
  })

  const forksValues: Array<string> = [
    'https://gist.github.com/defunkt/forks',
    'https://gist.github.com/defunkt/forked',
    'https://gist.github.com/defunkt/forks/',
    'https://gist.github.com/defunkt/Forks',
  ]

  it.each(forksValues)('should return the forked gists for %s', (value) => {
    const expected: GithubGistUrl = { kind: 'forks', username: 'defunkt' }

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

  describe('getFeedKey', () => {
    it('should return the gists key for a user feed', () => {
      const value = 'https://gist.github.com/alice.atom'
      const expected = 'github-gist:gists'

      expect(githubGistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the starred key for a starred feed', () => {
      const value = 'https://gist.github.com/alice/starred.atom'
      const expected = 'github-gist:starred'

      expect(githubGistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the forks key for a forked feed', () => {
      const value = 'https://gist.github.com/alice/forked.atom'
      const expected = 'github-gist:forks'

      expect(githubGistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the discover key for the discover feed', () => {
      const value = 'https://gist.github.com/discover.atom'
      const expected = 'github-gist:discover'

      expect(githubGistHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the gists key for a user feed with a trailing slash', () => {
      const value = 'https://gist.github.com/alice.atom/'
      const expected = 'github-gist:gists'

      expect(githubGistHandler.getFeedKey?.(value)).toBe(expected)
    })

    const discoverValues: Array<string> = [
      'https://gist.github.com/discover/starred.atom',
      'https://gist.github.com/Discover/forked.atom',
    ]

    it.each(discoverValues)('should return undefined for %s', (value) => {
      expect(githubGistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a dotted name', () => {
      const value = 'https://gist.github.com/alice.example.atom'

      expect(githubGistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a user page', () => {
      const value = 'https://gist.github.com/alice'

      expect(githubGistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the forks path the site serves as the user gists', () => {
      const value = 'https://gist.github.com/alice/forks.atom'

      expect(githubGistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the homepage', () => {
      const value = 'https://gist.github.com/'

      expect(githubGistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://github.com/alice.atom'

      expect(githubGistHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not-a-url'

      expect(githubGistHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [githubGistHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
