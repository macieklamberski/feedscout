import { describe, expect, it } from 'bun:test'
import type { GiteaUrl } from './gitea.js'
import { giteaHandler, parseGiteaUrl } from './gitea.js'

describe('parseGiteaUrl', () => {
  it('should return the user for a user page', () => {
    const expected: GiteaUrl = { kind: 'user', owner: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo')).toEqual(expected)
  })

  it('should return the repo for a repo page', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'forgejo', repo: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo/forgejo')).toEqual(expected)
  })

  it('should return the repo for a repo subpage', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'forgejo', repo: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo/forgejo/issues')).toEqual(expected)
  })

  it('should return the branch path for a branch page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'main',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the branch and file path for a file page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo/docs/README.md'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'forgejo/docs/README.md',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should keep a branch name with a slash whole', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/branch/v11.0/forgejo'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'v11.0/forgejo',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the branch path for capitalized route segments', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/Src/Branch/main'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'main',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the repo without a branch path for a tag page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/tag/v11.0.0'
    const expected: GiteaUrl = { kind: 'repo', owner: 'forgejo', repo: 'forgejo' }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the repo on any host', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'owner', repo: 'project' }

    expect(parseGiteaUrl('https://git.example.org/owner/project')).toEqual(expected)
  })

  const userRouteValues: Array<string> = [
    'https://codeberg.org/forgejo.rss',
    'https://codeberg.org/forgejo.atom',
    'https://codeberg.org/forgejo.keys',
    'https://codeberg.org/forgejo.gpg',
    'https://codeberg.org/forgejo.png',
  ]

  it.each(userRouteValues)('should strip the user route suffix from %s', (value) => {
    const expected: GiteaUrl = { kind: 'user', owner: 'forgejo' }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should strip the user route suffix in another case', () => {
    const expected: GiteaUrl = { kind: 'user', owner: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo.RSS')).toEqual(expected)
  })

  it('should keep dots in a username', () => {
    const expected: GiteaUrl = { kind: 'user', owner: 'a.bianco' }

    expect(parseGiteaUrl('https://codeberg.org/a.bianco')).toEqual(expected)
  })

  it('should keep dots in the username of a repo page', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'a.bianco', repo: 'notes' }

    expect(parseGiteaUrl('https://codeberg.org/a.bianco/notes')).toEqual(expected)
  })

  const excludedValues: Array<string> = [
    'https://codeberg.org/explore',
    'https://codeberg.org/admin',
    'https://codeberg.org/user',
    'https://codeberg.org/assets',
    'https://codeberg.org/api',
    'https://codeberg.org/-',
  ]

  it.each(excludedValues)('should return undefined for %s', (value) => {
    expect(parseGiteaUrl(value)).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseGiteaUrl('https://codeberg.org/Explore')).toBeUndefined()
    expect(parseGiteaUrl('https://codeberg.org/ADMIN')).toBeUndefined()
  })

  const excludedRepoValues: Array<string> = [
    'https://codeberg.org/explore/repos',
    'https://codeberg.org/admin/users',
    'https://codeberg.org/user/login',
  ]

  it.each(excludedRepoValues)('should return undefined for %s', (value) => {
    expect(parseGiteaUrl(value)).toBeUndefined()
  })

  it('should return undefined for an excluded path with a route suffix', () => {
    expect(parseGiteaUrl('https://codeberg.org/explore.rss')).toBeUndefined()
  })

  it('should return undefined for a route suffix without a user', () => {
    expect(parseGiteaUrl('https://codeberg.org/.rss')).toBeUndefined()
  })

  it('should return undefined for the instance root', () => {
    expect(parseGiteaUrl('https://codeberg.org/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGiteaUrl('not-a-url')).toBeUndefined()
  })
})

describe('giteaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://codeberg.org/forgejo'],
      [true, 'https://www.codeberg.org/forgejo'],
      [true, 'https://gitea.com/gitea'],
      [true, 'https://www.gitea.com/gitea'],
      [false, 'https://codeberg.org/user'],
      [false, 'https://example.org/user/repo'],
      [false, 'https://example.com/owner'],
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

    it('should return the branch commits feed first for a branch page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/atom/branch/forgejo',
            'https://codeberg.org/forgejo/forgejo/rss/branch/forgejo',
          ],
          hint: { key: 'gitea:branch-commits', label: 'Branch commits' },
        },
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

    it('should return the file history feed first for a file page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo/README.md'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/atom/branch/forgejo/README.md',
            'https://codeberg.org/forgejo/forgejo/rss/branch/forgejo/README.md',
          ],
          hint: { key: 'gitea:file-history', label: 'File history' },
        },
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

    it('should return empty array for an excluded path', () => {
      expect(giteaHandler.resolve('https://codeberg.org/explore')).toEqual([])
    })
  })
})
