import { describe, expect, it } from 'bun:test'
import { giteaHandler } from './gitea.js'

describe('giteaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://codeberg.org/forgejo'],
      [true, 'https://codeberg.org/forgejo/forgejo'],
      [true, 'https://www.codeberg.org/forgejo'],
      [true, 'https://gitea.com/gitea'],
      [true, 'https://gitea.com/gitea/go-sdk'],
      [true, 'https://www.gitea.com/gitea'],
      [false, 'https://codeberg.org/user'],
      [false, 'https://gitea.com/explore'],
      [false, 'https://codeberg.org/'],
      [false, 'https://github.com/user/repo'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(giteaHandler.match(url)).toBe(expected)
    })

    it('should match a self-hosted instance by the session cookie', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'i_like_gitea=abc123; Path=/; HttpOnly' })

      expect(giteaHandler.match(value, '', headers)).toBe(true)
    })

    it('should not match a self-hosted instance without the cookie', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'session=abc123; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(false)
      expect(giteaHandler.match(value)).toBe(false)
    })

    it('should match a renamed session cookie', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'example-gitea=abc123; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(true)
    })

    it('should not match a cookie whose name only starts with the marker', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'gitea_theme=dark; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(false)
    })

    it('should not match the marker inside a cookie value', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'session=i_like_gitea=abc123; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(giteaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return activity feed for user page', () => {
      const value = 'https://codeberg.org/forgejo'
      const expected = [
        {
          uri: ['https://codeberg.org/forgejo.atom', 'https://codeberg.org/forgejo.rss'],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return releases, tags, and activity feeds for repo page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for repo subpage', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/issues'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return branch commits feed for Gitea branch page', () => {
      const value = 'https://gitea.com/gitea/go-sdk/src/branch/main'
      const expected = [
        {
          uri: 'https://gitea.com/gitea/go-sdk/rss/branch/main',
          hint: { key: 'gitea:branch-commits', label: 'Branch commits' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/releases.atom',
            'https://gitea.com/gitea/go-sdk/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/tags.atom',
            'https://gitea.com/gitea/go-sdk/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: ['https://gitea.com/gitea/go-sdk.atom', 'https://gitea.com/gitea/go-sdk.rss'],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return file history feed for Gitea file page', () => {
      const value = 'https://gitea.com/gitea/go-sdk/src/branch/main/README.md'
      const expected = [
        {
          uri: 'https://gitea.com/gitea/go-sdk/rss/branch/main/README.md',
          hint: { key: 'gitea:file-history', label: 'File history' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/releases.atom',
            'https://gitea.com/gitea/go-sdk/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/tags.atom',
            'https://gitea.com/gitea/go-sdk/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: ['https://gitea.com/gitea/go-sdk.atom', 'https://gitea.com/gitea/go-sdk.rss'],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should not emit branch commits feed for Codeberg branch page (Forgejo dropped the route)', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for gitea.com', () => {
      const value = 'https://gitea.com/gitea/go-sdk'
      const expected = [
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/releases.atom',
            'https://gitea.com/gitea/go-sdk/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/tags.atom',
            'https://gitea.com/gitea/go-sdk/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: ['https://gitea.com/gitea/go-sdk.atom', 'https://gitea.com/gitea/go-sdk.rss'],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://codeberg.org'

      expect(giteaHandler.resolve(value)).toEqual([])
    })

    const excludedValues: Array<string> = [
      'https://codeberg.org/explore',
      'https://codeberg.org/admin',
      'https://codeberg.org/user',
      'https://codeberg.org/assets',
      'https://codeberg.org/-',
    ]

    it.each(excludedValues)('should return empty array for %s', (value) => {
      expect(giteaHandler.resolve(value)).toEqual([])
    })

    const excludedRepoValues: Array<string> = [
      'https://codeberg.org/explore/repos',
      'https://codeberg.org/admin/users',
      'https://codeberg.org/user/login',
    ]

    it.each(excludedRepoValues)('should return empty array for %s', (value) => {
      expect(giteaHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
