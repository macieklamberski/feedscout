import { describe, expect, it } from 'bun:test'
import { githubGistHandler } from './githubGist.js'

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
