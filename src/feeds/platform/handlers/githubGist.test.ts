import { describe, expect, it } from 'bun:test'
import { githubGistHandler } from './githubGist.js'

describe('githubGistHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://gist.github.com/defunkt', true],
      ['https://gist.github.com/defunkt/1234567890abcdef', true],
      ['https://github.com/defunkt', false],
      ['https://example.com/gist', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(githubGistHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return Atom feed URL for user gists page', () => {
      const value = 'https://gist.github.com/defunkt'
      const expected = ['https://gist.github.com/defunkt.atom']

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return Atom feed URL for user gists page with trailing slash', () => {
      const value = 'https://gist.github.com/defunkt/'
      const expected = ['https://gist.github.com/defunkt.atom']

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return user feed for specific gist', () => {
      const value = 'https://gist.github.com/defunkt/1234567890abcdef'
      const expected = ['https://gist.github.com/defunkt.atom']

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return starred gists feed for user starred page', () => {
      const value = 'https://gist.github.com/defunkt/starred'
      const expected = ['https://gist.github.com/defunkt/starred.atom']

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return starred gists feed with trailing slash', () => {
      const value = 'https://gist.github.com/defunkt/starred/'
      const expected = ['https://gist.github.com/defunkt/starred.atom']

      expect(githubGistHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const excludedUrls = [
        'https://gist.github.com/discover',
        'https://gist.github.com/search',
        'https://gist.github.com/login',
        'https://gist.github.com/join',
      ]

      for (const url of excludedUrls) {
        expect(githubGistHandler.resolve(url)).toEqual([])
      }
    })

    it('should return empty array for root path', () => {
      const value = 'https://gist.github.com/'

      expect(githubGistHandler.resolve(value)).toEqual([])
    })
  })
})
