import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn } from '../../../common/types.js'
import { githubHandler } from './github.js'

const createMockFetch = (body = ''): DiscoverFetchFn => {
  return async () => ({ body, headers: new Headers(), url: '', status: 200, statusText: 'OK' })
}

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
    it('should return releases and commits feeds for repository', async () => {
      const value = await githubHandler.resolve(
        'https://github.com/microsoft/vscode',
        createMockFetch(),
      )

      expect(value).toEqual([
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
      ])
    })

    it('should include branch-specific commits feed when on branch page', async () => {
      const value = await githubHandler.resolve(
        'https://github.com/microsoft/vscode/tree/main',
        createMockFetch(),
      )

      expect(value).toEqual([
        'https://github.com/microsoft/vscode/releases.atom',
        'https://github.com/microsoft/vscode/commits.atom',
        'https://github.com/microsoft/vscode/commits/main.atom',
      ])
    })

    it('should return empty array for special paths', async () => {
      const value = await githubHandler.resolve(
        'https://github.com/settings/profile',
        createMockFetch(),
      )

      expect(value).toEqual([])
    })

    it('should return empty array when missing repo name', async () => {
      const value = await githubHandler.resolve('https://github.com/microsoft', createMockFetch())

      expect(value).toEqual([])
    })
  })
})
