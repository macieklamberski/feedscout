import { describe, expect, it } from 'bun:test'
import { githubGistHandler } from './githubGist.js'

describe('githubGistHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://gist.github.com/username', true],
      ['https://gist.github.com/username/abc123def', true],
      ['https://github.com/owner/repo', false],
      ['https://gitlab.com/owner/repo', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(githubGistHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return user gists feed for user page', () => {
      const value = 'https://gist.github.com/torvalds'
      const expected = ['https://gist.github.com/torvalds.atom']

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return user gists feed for user page with trailing slash', () => {
      const value = 'https://gist.github.com/torvalds/'
      const expected = ['https://gist.github.com/torvalds.atom']

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return revisions and user feeds for specific gist', () => {
      const value = 'https://gist.github.com/torvalds/abc123def456'
      const expected = [
        'https://gist.github.com/torvalds/abc123def456/revisions.atom',
        'https://gist.github.com/torvalds.atom',
      ]

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(githubGistHandler.resolve('https://gist.github.com/discover')).toEqual([])
      expect(githubGistHandler.resolve('https://gist.github.com/search')).toEqual([])
      expect(githubGistHandler.resolve('https://gist.github.com/starred')).toEqual([])
    })

    it('should return empty array for root path', () => {
      const value = 'https://gist.github.com/'
      const expected: Array<string> = []

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })
  })
})
