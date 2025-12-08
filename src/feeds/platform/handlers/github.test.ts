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
    it('should return releases and commits feeds for repository', () => {
      const value = 'https://github.com/microsoft/vscode'
      const expected = [
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should include branch-specific commits feed when on branch page', () => {
      const value = 'https://github.com/microsoft/vscode/tree/main'
      const expected = [
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/commits/main.atom',
      ]

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://github.com/settings/profile'
      const expected: Array<string> = []

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })

    it('should return empty array when missing repo name', () => {
      const value = 'https://github.com/microsoft'
      const expected: Array<string> = []

      expect(githubHandler.resolve(value, '')).toEqual(expected)
    })
  })
})
