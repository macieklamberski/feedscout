import { describe, expect, it } from 'bun:test'
import { githubGistHandler } from './githubGist.js'

describe('githubGistHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://gist.github.com/defunkt'],
      [true, 'https://gist.github.com/defunkt/1234567890abcdef'],
      [false, 'https://github.com/defunkt'],
      [false, 'https://example.com/gist'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(githubGistHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(githubGistHandler.match('not-a-url')).toBe(false)
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

    it('should return Atom feed URL for user gists page with trailing slash', () => {
      const value = 'https://gist.github.com/defunkt/'
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt.atom',
          hint: { key: 'github-gist:gists', label: 'Gists' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for specific gist', () => {
      const value = 'https://gist.github.com/defunkt/1234567890abcdef'
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

    it('should return starred gists feed with trailing slash', () => {
      const value = 'https://gist.github.com/defunkt/starred/'
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt/starred.atom',
          hint: { key: 'github-gist:starred', label: 'Starred' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return forks gists feed for user forks page', () => {
      const value = 'https://gist.github.com/defunkt/forks'
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt/forks.atom',
          hint: { key: 'github-gist:forks', label: 'Forks' },
        },
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return forks gists feed with trailing slash', () => {
      const value = 'https://gist.github.com/defunkt/forks/'
      const expected = [
        {
          uri: 'https://gist.github.com/defunkt/forks.atom',
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

    const excludedValues: Array<string> = [
      'https://gist.github.com/search',
      'https://gist.github.com/login',
      'https://gist.github.com/join',
    ]

    it.each(excludedValues)('should return empty array for %s', (value) => {
      expect(githubGistHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for gist URL with excluded username', () => {
      const value = 'https://gist.github.com/discover/1234567890abcdef'

      expect(githubGistHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for root path', () => {
      const value = 'https://gist.github.com/'

      expect(githubGistHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
