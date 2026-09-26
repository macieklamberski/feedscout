import { describe, expect, it } from 'bun:test'
import type { GithubUrl } from './github.js'
import { githubHandler, parseGithubUrl } from './github.js'

describe('parseGithubUrl', () => {
  it('should return the owner for a profile page', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'microsoft' }

    expect(parseGithubUrl('https://github.com/microsoft')).toEqual(expected)
  })

  it('should return the owner for a name with dashes', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'my-org' }

    expect(parseGithubUrl('https://github.com/my-org')).toEqual(expected)
  })

  it('should keep the owner case', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'Octocat' }

    expect(parseGithubUrl('https://github.com/Octocat')).toEqual(expected)
  })

  it('should return the owner for the www host', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'octocat' }

    expect(parseGithubUrl('https://www.github.com/octocat')).toEqual(expected)
  })

  const routeSuffixValues: Array<string> = [
    'https://github.com/octocat.atom',
    'https://github.com/octocat.png',
  ]

  it.each(routeSuffixValues)('should strip the route suffix from %s', (value) => {
    const expected: GithubUrl = { kind: 'user', owner: 'octocat' }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  it('should return the repo for a repository page', () => {
    const expected: GithubUrl = { kind: 'repo', owner: 'octocat', repo: 'Hello-World' }

    expect(parseGithubUrl('https://github.com/octocat/Hello-World')).toEqual(expected)
  })

  it('should return the repo for a repository subpage', () => {
    const value = 'https://github.com/octocat/Hello-World/tree/main/src'
    const expected: GithubUrl = { kind: 'repo', owner: 'octocat', repo: 'Hello-World' }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  it('should keep a URL-encoded repo name', () => {
    const expected: GithubUrl = { kind: 'repo', owner: 'owner', repo: 'my%20repo' }

    expect(parseGithubUrl('https://github.com/owner/my%20repo')).toEqual(expected)
  })

  const excludedValues: Array<string> = [
    'https://github.com/explore',
    'https://github.com/copilot',
    'https://github.com/dashboard',
    'https://github.com/features',
    'https://github.com/login',
    'https://github.com/marketplace',
  ]

  it.each(excludedValues)('should return undefined for %s', (value) => {
    expect(parseGithubUrl(value)).toBeUndefined()
  })

  const nestedExcludedValues: Array<string> = [
    'https://github.com/settings/profile',
    'https://github.com/features/actions',
    'https://github.com/orgs/github/teams',
  ]

  it.each(nestedExcludedValues)('should return undefined for %s', (value) => {
    expect(parseGithubUrl(value)).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseGithubUrl('https://github.com/Features')).toBeUndefined()
    expect(parseGithubUrl('https://github.com/EXPLORE')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseGithubUrl('https://github.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGithubUrl('https://example.com/owner/repo')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGithubUrl('not-a-url')).toBeUndefined()
  })
})

describe('githubHandler', () => {
  describe('match', () => {
    it('should match a GitHub URL', () => {
      expect(githubHandler.match('https://github.com/owner/repo')).toBe(true)
    })

    it('should not match another host', () => {
      expect(githubHandler.match('https://example.com/owner/repo')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the wiki feed for a capitalized wiki segment', () => {
      const value = 'https://github.com/microsoft/vscode/Wiki'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/wiki.atom',
          hint: { key: 'github:wiki', label: 'Wiki' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should not return the wiki feed for a repository named wiki', () => {
      const value = 'https://github.com/owner/Wiki'
      const expected = [
        {
          uri: 'https://github.com/owner/Wiki/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/owner/Wiki/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/owner/Wiki/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should not return the discussions feed for a repository named discussions', () => {
      const value = 'https://github.com/owner/Discussions'
      const expected = [
        {
          uri: 'https://github.com/owner/Discussions/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/owner/Discussions/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/owner/Discussions/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should return releases, commits, and tags feeds for repository', () => {
      const value = 'https://github.com/microsoft/vscode'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include wiki feed when on wiki page', () => {
      const value = 'https://github.com/microsoft/vscode/wiki'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/wiki.atom',
          hint: { key: 'github:wiki', label: 'Wiki' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include branch-specific commits feed when on branch page', () => {
      const value = 'https://github.com/microsoft/vscode/tree/main'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits/main.atom',
          hint: { key: 'github:branch-commits', label: 'Branch commits' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include branch-specific commits feed when on branch page with a capitalized tree segment', () => {
      const value = 'https://github.com/microsoft/vscode/Tree/main'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits/main.atom',
          hint: { key: 'github:branch-commits', label: 'Branch commits' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should not include branch commits feed for tree path with subdirectory', () => {
      const value = 'https://github.com/microsoft/vscode/tree/main/src'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include discussions feed when on discussions page', () => {
      const value = 'https://github.com/microsoft/vscode/discussions'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/discussions.atom',
          hint: { key: 'github:discussions', label: 'Discussions' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include discussions feed when on discussions page with a capitalized discussions segment', () => {
      const value = 'https://github.com/microsoft/vscode/Discussions'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/discussions.atom',
          hint: { key: 'github:discussions', label: 'Discussions' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include category-scoped discussion feed when on category page', () => {
      const value = 'https://github.com/microsoft/vscode/discussions/categories/announcements'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/discussions.atom',
          hint: { key: 'github:discussions', label: 'Discussions' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/discussions/categories/announcements.atom',
          hint: { key: 'github:discussion-category', label: 'Discussion category' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include category-scoped discussion feed when on category page with a capitalized categories segment', () => {
      const value = 'https://github.com/microsoft/vscode/discussions/Categories/announcements'
      const expected = [
        {
          uri: 'https://github.com/microsoft/vscode/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/discussions.atom',
          hint: { key: 'github:discussions', label: 'Discussions' },
        },
        {
          uri: 'https://github.com/microsoft/vscode/discussions/categories/announcements.atom',
          hint: { key: 'github:discussion-category', label: 'Discussion category' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should return user activity feed for user profile page', () => {
      const value = 'https://github.com/microsoft'
      const expected = [
        {
          uri: 'https://github.com/microsoft.atom',
          hint: { key: 'github:activity', label: 'Activity' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    const routeSuffixValues: Array<string> = [
      'https://github.com/torvalds.atom',
      'https://github.com/torvalds.png',
    ]

    it.each(routeSuffixValues)('should return the user activity feed for %s', (value) => {
      const expected = [
        {
          uri: 'https://github.com/torvalds.atom',
          hint: { key: 'github:activity', label: 'Activity' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(githubHandler.resolve('https://github.com/explore')).toEqual([])
    })

    it('should not include wiki feed for repos with wiki in name', () => {
      const value = 'https://github.com/owner/wiki-tools'
      const expected = [
        {
          uri: 'https://github.com/owner/wiki-tools/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/owner/wiki-tools/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/owner/wiki-tools/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should not include discussions feed for repos with discussions in name', () => {
      const value = 'https://github.com/owner/discussions-api'
      const expected = [
        {
          uri: 'https://github.com/owner/discussions-api/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/owner/discussions-api/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/owner/discussions-api/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include file-specific commits feed when viewing a file', () => {
      const value = 'https://github.com/anthropics/sdk/blob/main/src/index.ts'
      const expected = [
        {
          uri: 'https://github.com/anthropics/sdk/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/commits/main/src/index.ts.atom',
          hint: { key: 'github:file-history', label: 'File history' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include file-specific commits feed when viewing a file with a capitalized blob segment', () => {
      const value = 'https://github.com/anthropics/sdk/Blob/main/src/index.ts'
      const expected = [
        {
          uri: 'https://github.com/anthropics/sdk/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/commits/main/src/index.ts.atom',
          hint: { key: 'github:file-history', label: 'File history' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include file-specific commits feed when on file history page', () => {
      const value = 'https://github.com/anthropics/sdk/commits/main/src/index.ts'
      const expected = [
        {
          uri: 'https://github.com/anthropics/sdk/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
        {
          uri: 'https://github.com/anthropics/sdk/commits/main/src/index.ts.atom',
          hint: { key: 'github:file-history', label: 'File history' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })
  })
})
