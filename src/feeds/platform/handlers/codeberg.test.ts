import { describe, expect, it } from 'bun:test'
import { codebergHandler } from './codeberg.js'

describe('codebergHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://codeberg.org/forgejo', true],
      ['https://codeberg.org/forgejo/forgejo', true],
      ['https://www.codeberg.org/user', true],
      ['https://gitea.com/gitea', true],
      ['https://gitea.com/gitea/go-sdk', true],
      ['https://www.gitea.com/user', true],
      ['https://github.com/user/repo', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(codebergHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(codebergHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return rss feed for user page', () => {
      const value = 'https://codeberg.org/forgejo'
      const expected = [
        {
          uri: 'https://codeberg.org/forgejo.rss',
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return releases, tags, and activity feeds for repo page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo'
      const expected = [
        {
          uri: 'https://codeberg.org/forgejo/forgejo/releases.rss',
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo/tags.rss',
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo.rss',
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for repo subpage', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/issues'
      const expected = [
        {
          uri: 'https://codeberg.org/forgejo/forgejo/releases.rss',
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo/tags.rss',
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo.rss',
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return branch commits feed for branch page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main'
      const expected = [
        {
          uri: 'https://codeberg.org/forgejo/forgejo/rss/branch/main',
          hint: { key: 'codeberg:branch-commits', label: 'Branch commits' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo/releases.rss',
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo/tags.rss',
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo.rss',
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return file history feed for file page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main/README.md'
      const expected = [
        {
          uri: 'https://codeberg.org/forgejo/forgejo/rss/branch/main/README.md',
          hint: { key: 'codeberg:file-history', label: 'File history' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo/releases.rss',
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo/tags.rss',
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: 'https://codeberg.org/forgejo/forgejo.rss',
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for gitea.com', () => {
      const value = 'https://gitea.com/gitea/go-sdk'
      const expected = [
        {
          uri: 'https://gitea.com/gitea/go-sdk/releases.rss',
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: 'https://gitea.com/gitea/go-sdk/tags.rss',
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: 'https://gitea.com/gitea/go-sdk.rss',
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://codeberg.org'

      expect(codebergHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://codeberg.org/explore',
        'https://codeberg.org/admin',
        'https://codeberg.org/user',
        'https://codeberg.org/assets',
        'https://codeberg.org/-',
      ]

      for (const value of values) {
        expect(codebergHandler.resolve(value)).toEqual([])
      }
    })

    it('should return empty array for excluded paths with repo segment', () => {
      const values = [
        'https://codeberg.org/explore/repos',
        'https://codeberg.org/admin/users',
        'https://codeberg.org/user/login',
      ]

      for (const value of values) {
        expect(codebergHandler.resolve(value)).toEqual([])
      }
    })
  })
})
