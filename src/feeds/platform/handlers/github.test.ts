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
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/tags.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should include wiki feed when on wiki page', () => {
      const value = 'https://github.com/microsoft/vscode/wiki'
      const expected = [
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/tags.atom',
        'https://github.com/microsoft/vscode/wiki.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should include wiki feed when on specific wiki subpage', () => {
      const value = 'https://github.com/microsoft/vscode/wiki/Roadmap'
      const expected = [
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/tags.atom',
        'https://github.com/microsoft/vscode/wiki.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should include branch-specific commits feed when on branch page', () => {
      const value = 'https://github.com/microsoft/vscode/tree/main'
      const expected = [
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/tags.atom',
        'https://github.com/microsoft/vscode/commits/main.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should include discussions feed when on discussions page', () => {
      const value = 'https://github.com/microsoft/vscode/discussions'
      const expected = [
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/tags.atom',
        'https://github.com/microsoft/vscode/discussions.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should include discussions feed when on specific discussion', () => {
      const value = 'https://github.com/microsoft/vscode/discussions/12345'
      const expected = [
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/tags.atom',
        'https://github.com/microsoft/vscode/discussions.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return user activity feed for user profile page', () => {
      const value = 'https://github.com/microsoft'
      const expected = ['https://github.com/microsoft.atom']

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return user activity feed for user profile page with trailing slash', () => {
      const value = 'https://github.com/torvalds/'
      const expected = ['https://github.com/torvalds.atom']

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://github.com/settings/profile'
      const expected: Array<string> = []

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return empty array for excluded user-level paths', () => {
      const value = 'https://github.com/explore'
      const expected: Array<string> = []

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })
  })
})
