import { describe, expect, it } from 'bun:test'
import { githubHandler } from './github.js'

describe('githubHandler', () => {
  describe('match', () => {
    it('should match a profile page', () => {
      expect(githubHandler.match('https://github.com/octocat')).toBe(true)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubHandler.resolve('https://github.com/octocat')).toEqual(expected)
    })

    it('should resolve user avatar from repo URL', () => {
      const expected = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubHandler.resolve('https://github.com/octocat/Hello-World')).toEqual(expected)
    })

    it('should resolve organization avatar from organization discussions URL', () => {
      const expected = [{ uri: 'https://github.com/acme.png' }]

      expect(githubHandler.resolve('https://github.com/orgs/acme/discussions')).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(githubHandler.resolve('https://github.com/features')).toEqual([])
    })
  })
})
