import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { githubGistHandler } from './githubGist.js'

describe('githubGistHandler', () => {
  describe('match', () => {
    it('should match gist.github.com URLs', () => {
      expect(githubGistHandler.match('https://gist.github.com/octocat')).toBe(true)
    })

    it('should not match github.com URLs', () => {
      expect(githubGistHandler.match('https://github.com/octocat')).toBe(false)
    })

    it('should not match non-github URLs', () => {
      expect(githubGistHandler.match('https://gitlab.com/user')).toBe(false)
    })

    it('should throw for invalid URL', () => {
      expect(() => githubGistHandler.match('not-a-url')).toThrow()
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const value = githubGistHandler.resolve('https://gist.github.com/octocat')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(value).toEqual(expected)
    })

    it('should resolve user avatar from gist URL', () => {
      const value = githubGistHandler.resolve('https://gist.github.com/octocat/abc123def456')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(value).toEqual(expected)
    })

    it('should resolve user avatar from starred URL', () => {
      const value = githubGistHandler.resolve('https://gist.github.com/octocat/starred')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(value).toEqual(expected)
    })

    it('should return empty array for root URL', () => {
      const value = githubGistHandler.resolve('https://gist.github.com')

      expect(value).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      expect(githubGistHandler.resolve('https://gist.github.com/discover')).toEqual([])
      expect(githubGistHandler.resolve('https://gist.github.com/search')).toEqual([])
      expect(githubGistHandler.resolve('https://gist.github.com/login')).toEqual([])
      expect(githubGistHandler.resolve('https://gist.github.com/join')).toEqual([])
      expect(githubGistHandler.resolve('https://gist.github.com/settings')).toEqual([])
    })

    it('should handle excluded paths case-insensitively', () => {
      expect(githubGistHandler.resolve('https://gist.github.com/Discover')).toEqual([])
      expect(githubGistHandler.resolve('https://gist.github.com/SEARCH')).toEqual([])
    })
  })
})
