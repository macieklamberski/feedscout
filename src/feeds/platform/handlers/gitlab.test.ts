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

    it('should return atom feed for repo page', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab'
      const expected = ['https://gitlab.com/gitlab-org/gitlab.atom']

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for repo subpage', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab/-/issues'
      const expected = ['https://gitlab.com/gitlab-org/gitlab.atom']

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://gitlab.com'
      const expected: Array<string> = []

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })
  })
})
