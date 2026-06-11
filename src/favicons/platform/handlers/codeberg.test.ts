import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { codebergHandler } from './codeberg.js'

describe('codebergHandler', () => {
  describe('match', () => {
    it('should match codeberg.org URLs', () => {
      expect(codebergHandler.match('https://codeberg.org/user')).toBe(true)
    })

    it('should match www.codeberg.org URLs', () => {
      expect(codebergHandler.match('https://www.codeberg.org/user')).toBe(true)
    })

    it('should match gitea.com URLs', () => {
      expect(codebergHandler.match('https://gitea.com/user')).toBe(true)
    })

    it('should match www.gitea.com URLs', () => {
      expect(codebergHandler.match('https://www.gitea.com/user')).toBe(true)
    })

    it('should not match non-codeberg URLs', () => {
      expect(codebergHandler.match('https://github.com/user')).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(codebergHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(codebergHandler.resolve('https://codeberg.org/forgejo')).toEqual(expected)
    })

    it('should resolve user avatar from repo URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(codebergHandler.resolve('https://codeberg.org/forgejo/forgejo')).toEqual(expected)
    })

    it('should resolve user avatar from deep path', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should resolve user avatar using gitea.com origin', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://gitea.com/user/avatar/gitea/512' }]

      expect(codebergHandler.resolve('https://gitea.com/gitea')).toEqual(expected)
    })

    it('should return empty array for root URL', () => {
      expect(codebergHandler.resolve('https://codeberg.org')).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      expect(codebergHandler.resolve('https://codeberg.org/explore')).toEqual([])
      expect(codebergHandler.resolve('https://codeberg.org/admin')).toEqual([])
      expect(codebergHandler.resolve('https://codeberg.org/api')).toEqual([])
    })

    it('should handle excluded paths case-insensitively', () => {
      expect(codebergHandler.resolve('https://codeberg.org/Explore')).toEqual([])
      expect(codebergHandler.resolve('https://codeberg.org/ADMIN')).toEqual([])
    })

    it('should resolve www.codeberg.org URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://www.codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(codebergHandler.resolve('https://www.codeberg.org/forgejo')).toEqual(expected)
    })

    it('should resolve www.gitea.com URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://www.gitea.com/user/avatar/gitea/512' },
      ]

      expect(codebergHandler.resolve('https://www.gitea.com/gitea')).toEqual(expected)
    })

    it('should strip feed extension from user URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(codebergHandler.resolve('https://codeberg.org/forgejo.rss')).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
