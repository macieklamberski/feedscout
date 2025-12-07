import { describe, expect, it } from 'bun:test'
import { githubHandler } from './github.js'

describe('githubHandler', () => {
  describe('match', () => {
    it.each([
      ['https://github.com/owner/repo', true],
      ['https://www.github.com/owner/repo', true],
      ['https://gitlab.com/owner/repo', false],
    ])('%s -> %s', (url, expected) => {
      expect(githubHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return releases and commits feeds for repository', () => {
      const value = githubHandler.resolve('https://github.com/microsoft/vscode', '')

      expect(value).toEqual([
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
      ])
    })

    it('should include branch-specific commits feed when on branch page', () => {
      const value = githubHandler.resolve('https://github.com/microsoft/vscode/tree/main', '')

      expect(value).toEqual([
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/commits/main.atom',
      ])
    })

    it('should return empty array for special paths', () => {
      const value = githubHandler.resolve('https://github.com/settings/profile', '')

      expect(value).toEqual([])
    })

    it('should return empty array when missing repo name', () => {
      const value = githubHandler.resolve('https://github.com/microsoft', '')

      expect(value).toEqual([])
    })
  })
})
