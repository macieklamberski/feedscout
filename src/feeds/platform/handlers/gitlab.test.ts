import { describe, expect, it } from 'bun:test'
import { gitlabHandler, isGitlabHeaders, isGitlabHtml } from './gitlab.js'

const selfHostedHtml = '<html><head><meta property="og:site_name" content="GitLab"></head></html>'
const selfHostedHeaders = new Headers({ 'x-gitlab-meta': '{"version":"1"}' })

describe('isGitlabHtml', () => {
  it('should return true for og:site_name GitLab meta tag', () => {
    expect(isGitlabHtml('<meta property="og:site_name" content="GitLab">')).toBe(true)
  })

  it('should return true regardless of attribute order', () => {
    expect(isGitlabHtml('<meta content="GitLab" property="og:site_name">')).toBe(true)
  })

  it('should return true when embedded in full HTML', () => {
    expect(isGitlabHtml(selfHostedHtml)).toBe(true)
  })

  it('should return false for non-GitLab og:site_name values', () => {
    expect(isGitlabHtml('<meta property="og:site_name" content="GitHub">')).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isGitlabHtml('')).toBe(false)
  })
})

describe('isGitlabHeaders', () => {
  it('should return true when x-gitlab-meta header is present', () => {
    expect(isGitlabHeaders(new Headers({ 'x-gitlab-meta': '{"version":"1"}' }))).toBe(true)
  })

  it('should return false when header is absent', () => {
    expect(isGitlabHeaders(new Headers())).toBe(false)
    expect(isGitlabHeaders(new Headers({ server: 'nginx' }))).toBe(false)
  })
})

describe('gitlabHandler', () => {
  describe('match', () => {
    it('should match gitlab.com user and repo URLs without content', () => {
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org')).toBe(true)
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org/gitlab')).toBe(true)
      expect(gitlabHandler.match('https://www.gitlab.com/user')).toBe(true)
    })

    it('should match self-hosted instance with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', selfHostedHtml)).toBe(true)
    })

    it('should match self-hosted instance with GitLab header', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', '', selfHostedHeaders)).toBe(
        true,
      )
    })

    it('should not match self-hosted root path even with GitLab signals', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com', selfHostedHtml)).toBe(false)
    })

    it('should not match self-hosted without content or headers', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user')).toBe(false)
    })

    it('should not match non-GitLab URLs', () => {
      expect(gitlabHandler.match('https://github.com/user/repo')).toBe(false)
      expect(gitlabHandler.match('https://example.com')).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(gitlabHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return atom feed for user page', () => {
      const value = 'https://gitlab.com/gitlab-org'
      const expected = [
        {
          uri: 'https://gitlab.com/gitlab-org.atom',
          hint: { key: 'gitlab:activity', label: 'Activity' },
        },
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return releases, tags, issues, merge requests, and activity feeds for repo page', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab'
      const expected = [
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/releases.atom',
          hint: { key: 'gitlab:releases', label: 'Releases' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/tags?format=atom',
          hint: { key: 'gitlab:tags', label: 'Tags' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/issues.atom',
          hint: { key: 'gitlab:issues', label: 'Issues' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/merge_requests.atom',
          hint: { key: 'gitlab:merge-requests', label: 'Merge requests' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab.atom',
          hint: { key: 'gitlab:activity', label: 'Activity' },
        },
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for repo subpage', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab/-/issues'
      const expected = [
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/releases.atom',
          hint: { key: 'gitlab:releases', label: 'Releases' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/tags?format=atom',
          hint: { key: 'gitlab:tags', label: 'Tags' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/issues.atom',
          hint: { key: 'gitlab:issues', label: 'Issues' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/merge_requests.atom',
          hint: { key: 'gitlab:merge-requests', label: 'Merge requests' },
        },
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab.atom',
          hint: { key: 'gitlab:activity', label: 'Activity' },
        },
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root page', () => {
      const value = 'https://gitlab.com'

      expect(gitlabHandler.resolve(value)).toEqual([])
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

    it('should return empty array for excluded paths with repo segment', () => {
      const values = [
        'https://gitlab.com/explore/projects',
        'https://gitlab.com/dashboard/issues',
        'https://gitlab.com/help/docs',
      ]

      for (const value of values) {
        expect(gitlabHandler.resolve(value)).toEqual([])
      }
    })

    it('should use first two path segments for deeply nested groups', () => {
      // gitlab.com/group/subgroup/project treats group as user and subgroup as repo.
      const value = 'https://gitlab.com/group/subgroup/project'
      const expected = [
        {
          uri: 'https://gitlab.com/group/subgroup/-/releases.atom',
          hint: { key: 'gitlab:releases', label: 'Releases' },
        },
        {
          uri: 'https://gitlab.com/group/subgroup/-/tags?format=atom',
          hint: { key: 'gitlab:tags', label: 'Tags' },
        },
        {
          uri: 'https://gitlab.com/group/subgroup/-/issues.atom',
          hint: { key: 'gitlab:issues', label: 'Issues' },
        },
        {
          uri: 'https://gitlab.com/group/subgroup/-/merge_requests.atom',
          hint: { key: 'gitlab:merge-requests', label: 'Merge requests' },
        },
        {
          uri: 'https://gitlab.com/group/subgroup.atom',
          hint: { key: 'gitlab:activity', label: 'Activity' },
        },
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })
  })
})
