import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { githubHandler } from './github.js'

describe('githubHandler', () => {
  describe('match', () => {
    it('should match github.com URLs', () => {
      expect(githubHandler.match('https://github.com/octocat')).toBe(true)
    })

    it('should match www.github.com URLs', () => {
      expect(githubHandler.match('https://www.github.com/octocat')).toBe(true)
    })

    it('should not match non-github URLs', () => {
      expect(githubHandler.match('https://gitlab.com/user')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const value = githubHandler.resolve('https://github.com/octocat')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(value).toEqual(expected)
    })

    it('should resolve user avatar from repo URL', () => {
      const value = githubHandler.resolve('https://github.com/octocat/Hello-World')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(value).toEqual(expected)
    })

    it('should resolve user avatar from deep repo path', () => {
      const value = githubHandler.resolve('https://github.com/octocat/Hello-World/tree/main/src')
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(value).toEqual(expected)
    })

    it('should return empty array for root URL', () => {
      const value = githubHandler.resolve('https://github.com')

      expect(value).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      expect(githubHandler.resolve('https://github.com/features')).toEqual([])
      expect(githubHandler.resolve('https://github.com/explore')).toEqual([])
      expect(githubHandler.resolve('https://github.com/login')).toEqual([])
      expect(githubHandler.resolve('https://github.com/marketplace')).toEqual([])
    })

    it('should handle excluded paths case-insensitively', () => {
      expect(githubHandler.resolve('https://github.com/Features')).toEqual([])
      expect(githubHandler.resolve('https://github.com/EXPLORE')).toEqual([])
    })
  })
})
