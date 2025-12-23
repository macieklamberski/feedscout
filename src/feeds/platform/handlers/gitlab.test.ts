import { describe, expect, it } from 'bun:test'
import { gitlabHandler } from './gitlab.js'

describe('gitlabHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://gitlab.com/gitlab-org', true],
      ['https://gitlab.com/gitlab-org/gitlab', true],
      ['https://www.gitlab.com/user', true],
      ['https://github.com/user/repo', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(gitlabHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return atom feed for user page', () => {
      const value = 'https://gitlab.com/gitlab-org'
      const expected = ['https://gitlab.com/gitlab-org.atom']

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return releases, tags, and activity feeds for repo page', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab'
      const expected = [
        'https://gitlab.com/gitlab-org/gitlab/-/releases.atom',
        'https://gitlab.com/gitlab-org/gitlab/-/tags?format=atom',
        'https://gitlab.com/gitlab-org/gitlab.atom',
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for repo subpage', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab/-/issues'
      const expected = [
        'https://gitlab.com/gitlab-org/gitlab/-/releases.atom',
        'https://gitlab.com/gitlab-org/gitlab/-/tags?format=atom',
        'https://gitlab.com/gitlab-org/gitlab.atom',
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://gitlab.com'
      const expected: Array<string> = []

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://gitlab.com/explore',
        'https://gitlab.com/dashboard',
        'https://gitlab.com/users',
        'https://gitlab.com/search',
        'https://gitlab.com/help',
      ]

      for (const value of values) {
        expect(gitlabHandler.resolve(value)).toEqual([])
      }
    })
  })
})
