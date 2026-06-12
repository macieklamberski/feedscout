import { describe, expect, it } from 'bun:test'
import { codebergHandler } from './codeberg.js'

describe('codebergHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://codeberg.org/forgejo'],
      [true, 'https://codeberg.org/forgejo/forgejo'],
      [true, 'https://www.codeberg.org/user'],
      [true, 'https://gitea.com/gitea'],
      [true, 'https://gitea.com/gitea/go-sdk'],
      [true, 'https://www.gitea.com/user'],
      [false, 'https://github.com/user/repo'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(codebergHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(codebergHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return activity feed for user page', () => {
      const value = 'https://codeberg.org/forgejo'
      const expected = [
        {
          uri: ['https://codeberg.org/forgejo.atom', 'https://codeberg.org/forgejo.rss'],
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return releases, tags, and activity feeds for repo page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for repo subpage', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/issues'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return branch commits feed for Gitea branch page', () => {
      const value = 'https://gitea.com/gitea/go-sdk/src/branch/main'
      const expected = [
        {
          uri: 'https://gitea.com/gitea/go-sdk/rss/branch/main',
          hint: { key: 'codeberg:branch-commits', label: 'Branch commits' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/releases.atom',
            'https://gitea.com/gitea/go-sdk/releases.rss',
          ],
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/tags.atom',
            'https://gitea.com/gitea/go-sdk/tags.rss',
          ],
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: ['https://gitea.com/gitea/go-sdk.atom', 'https://gitea.com/gitea/go-sdk.rss'],
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return file history feed for Gitea file page', () => {
      const value = 'https://gitea.com/gitea/go-sdk/src/branch/main/README.md'
      const expected = [
        {
          uri: 'https://gitea.com/gitea/go-sdk/rss/branch/main/README.md',
          hint: { key: 'codeberg:file-history', label: 'File history' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/releases.atom',
            'https://gitea.com/gitea/go-sdk/releases.rss',
          ],
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/tags.atom',
            'https://gitea.com/gitea/go-sdk/tags.rss',
          ],
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: ['https://gitea.com/gitea/go-sdk.atom', 'https://gitea.com/gitea/go-sdk.rss'],
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should not emit branch commits feed for Codeberg branch page (Forgejo dropped the route)', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for gitea.com', () => {
      const value = 'https://gitea.com/gitea/go-sdk'
      const expected = [
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/releases.atom',
            'https://gitea.com/gitea/go-sdk/releases.rss',
          ],
          hint: { key: 'codeberg:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/tags.atom',
            'https://gitea.com/gitea/go-sdk/tags.rss',
          ],
          hint: { key: 'codeberg:tags', label: 'Tags' },
        },
        {
          uri: ['https://gitea.com/gitea/go-sdk.atom', 'https://gitea.com/gitea/go-sdk.rss'],
          hint: { key: 'codeberg:activity', label: 'Activity' },
        },
      ]

      expect(codebergHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://codeberg.org'

      expect(codebergHandler.resolve(value)).toEqual([])
    })

    const excludedValues: Array<string> = [
      'https://codeberg.org/explore',
      'https://codeberg.org/admin',
      'https://codeberg.org/user',
      'https://codeberg.org/assets',
      'https://codeberg.org/-',
    ]

    it.each(excludedValues)('should return empty array for %s', (value) => {
      expect(codebergHandler.resolve(value)).toEqual([])
    })

    const excludedRepoValues: Array<string> = [
      'https://codeberg.org/explore/repos',
      'https://codeberg.org/admin/users',
      'https://codeberg.org/user/login',
    ]

    it.each(excludedRepoValues)('should return empty array for %s', (value) => {
      expect(codebergHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
