import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { giteaHandler } from './gitea.js'

describe('giteaHandler', () => {
  describe('match', () => {
    it('should match codeberg.org URLs', () => {
      expect(giteaHandler.match('https://codeberg.org/forgejo')).toBe(true)
      expect(giteaHandler.match('https://www.codeberg.org/forgejo')).toBe(true)
    })

    it('should match gitea.com URLs', () => {
      expect(giteaHandler.match('https://gitea.com/gitea')).toBe(true)
      expect(giteaHandler.match('https://www.gitea.com/gitea')).toBe(true)
    })

    it('should match a self-hosted instance by the session cookie', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'i_like_gitea=abc123; Path=/; HttpOnly' })

      expect(giteaHandler.match(value, '', headers)).toBe(true)
    })

    it('should not match a self-hosted instance without the cookie', () => {
      expect(giteaHandler.match('https://git.example.org/owner/project')).toBe(false)
    })

    it('should not match a reserved path', () => {
      expect(giteaHandler.match('https://codeberg.org/user')).toBe(false)
      expect(giteaHandler.match('https://gitea.com/explore')).toBe(false)
    })

    it('should not match the instance root', () => {
      expect(giteaHandler.match('https://codeberg.org/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(giteaHandler.match('https://github.com/octocat')).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(giteaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve user avatar from user URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(giteaHandler.resolve('https://codeberg.org/forgejo')).toEqual(expected)
    })

    it('should resolve user avatar from repo URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(giteaHandler.resolve('https://codeberg.org/forgejo/forgejo')).toEqual(expected)
    })

    it('should resolve user avatar from deep path', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should resolve user avatar using gitea.com origin', () => {
      const expected: Array<DiscoverUriEntry> = [{ uri: 'https://gitea.com/user/avatar/gitea/512' }]

      expect(giteaHandler.resolve('https://gitea.com/gitea')).toEqual(expected)
    })

    it('should return empty array for root URL', () => {
      expect(giteaHandler.resolve('https://codeberg.org')).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      expect(giteaHandler.resolve('https://codeberg.org/explore')).toEqual([])
      expect(giteaHandler.resolve('https://codeberg.org/admin')).toEqual([])
      expect(giteaHandler.resolve('https://codeberg.org/api')).toEqual([])
    })

    it('should handle excluded paths case-insensitively', () => {
      expect(giteaHandler.resolve('https://codeberg.org/Explore')).toEqual([])
      expect(giteaHandler.resolve('https://codeberg.org/ADMIN')).toEqual([])
    })

    it('should resolve www.codeberg.org URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://www.codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(giteaHandler.resolve('https://www.codeberg.org/forgejo')).toEqual(expected)
    })

    it('should resolve www.gitea.com URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://www.gitea.com/user/avatar/gitea/512' },
      ]

      expect(giteaHandler.resolve('https://www.gitea.com/gitea')).toEqual(expected)
    })

    it('should strip feed extension from user URL', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://codeberg.org/user/avatar/forgejo/512' },
      ]

      expect(giteaHandler.resolve('https://codeberg.org/forgejo.rss')).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
