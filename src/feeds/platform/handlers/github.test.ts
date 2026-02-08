import { describe, expect, it } from 'bun:test'
import { githubHandler } from './github.js'

describe('githubHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://github.com/owner/repo', true],
      ['https://www.github.com/owner/repo', true],
      ['https://gitlab.com/owner/repo', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(githubHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
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

    it('should include wiki feed when on specific wiki subpage', () => {
      const value = 'https://github.com/microsoft/vscode/wiki/Roadmap'
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

    it('should include discussions feed when on specific discussion', () => {
      const value = 'https://github.com/microsoft/vscode/discussions/12345'
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

    it('should return user activity feed for user profile page with trailing slash', () => {
      const value = 'https://github.com/torvalds/'
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
      expect(githubHandler.resolve('https://github.com/copilot')).toEqual([])
      expect(githubHandler.resolve('https://github.com/dashboard')).toEqual([])
    })

    it('should return empty array for nested excluded paths', () => {
      expect(githubHandler.resolve('https://github.com/settings/profile')).toEqual([])
      expect(githubHandler.resolve('https://github.com/features/actions')).toEqual([])
      expect(githubHandler.resolve('https://github.com/orgs/github/teams')).toEqual([])
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
