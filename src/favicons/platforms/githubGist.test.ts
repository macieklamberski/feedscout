import { describe, expect, it } from 'bun:test'
import { githubGistHandler } from './githubGist.js'

describe('githubGistHandler', () => {
  describe('match', () => {
    it('should match a user page', () => {
      expect(githubGistHandler.match('https://gist.github.com/octocat')).toBe(true)
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

    it('should return empty array for excluded paths', () => {
      expect(githubGistHandler.resolve('https://gist.github.com/search')).toEqual([])
    })
  })
})
