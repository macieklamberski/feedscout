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

    it('should return false for invalid URL', () => {
      expect(githubHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubHandler.resolve('https://github.com/octocat')).toEqual(expected)
    })

    it('should resolve user avatar from repo URL', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubHandler.resolve('https://github.com/octocat/Hello-World')).toEqual(expected)
    })

    it('should resolve user avatar from deep repo path', () => {
      const value = 'https://github.com/octocat/Hello-World/tree/main/src'
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root URL', () => {
      expect(githubHandler.resolve('https://github.com')).toEqual([])
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

    it('should resolve www.github.com URL', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubHandler.resolve('https://www.github.com/octocat')).toEqual(expected)
    })

    it('should resolve username with dashes', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/my-org.png' }]

      expect(githubHandler.resolve('https://github.com/my-org')).toEqual(expected)
    })

    it('should strip feed extension from user URL', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://github.com/octocat.png' }]

      expect(githubHandler.resolve('https://github.com/octocat.atom')).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
