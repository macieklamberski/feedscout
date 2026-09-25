import { describe, expect, it } from 'bun:test'
import type { GitlabUrl } from './gitlab.js'
import { gitlabHandler, isGitlabHeaders, isGitlabHtml, parseGitlabUrl } from './gitlab.js'

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

describe('parseGitlabUrl', () => {
  it('should return the namespace for a user or group page', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'gitlab-org' }

    expect(parseGitlabUrl('https://gitlab.com/gitlab-org')).toEqual(expected)
  })

  it('should return the namespace on any host', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'team' }

    expect(parseGitlabUrl('https://gitlab.mycompany.com/team')).toEqual(expected)
  })

  it('should keep dots in a namespace', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'john.doe' }

    expect(parseGitlabUrl('https://gitlab.com/john.doe')).toEqual(expected)
  })

  it('should strip the feed suffix from a namespace feed URL', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'alice' }

    expect(parseGitlabUrl('https://gitlab.com/alice.atom')).toEqual(expected)
  })

  it('should strip a capitalized feed suffix from a namespace feed URL', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'alice' }

    expect(parseGitlabUrl('https://gitlab.com/alice.ATOM')).toEqual(expected)
  })

  it('should strip the feed suffix from a dotted namespace', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'john.doe' }

    expect(parseGitlabUrl('https://gitlab.com/john.doe.atom')).toEqual(expected)
  })

  it('should return the project for a project page', () => {
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/gitlab',
    }

    expect(parseGitlabUrl('https://gitlab.com/gitlab-org/gitlab')).toEqual(expected)
  })

  it('should return the project for a project subpage', () => {
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/gitlab',
    }

    expect(parseGitlabUrl('https://gitlab.com/gitlab-org/gitlab/-/issues')).toEqual(expected)
  })

  it('should use the whole project path for a nested group project', () => {
    const value = 'https://gitlab.com/gitlab-org/security-products/analyzers/semgrep'
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/security-products/analyzers/semgrep',
    }

    expect(parseGitlabUrl(value)).toEqual(expected)
  })

  it('should stop the project path at the dash separator', () => {
    const value = 'https://gitlab.com/gitlab-org/security-products/analyzers/semgrep/-/issues'
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/security-products/analyzers/semgrep',
    }

    expect(parseGitlabUrl(value)).toEqual(expected)
  })

  it('should return the branch for /-/commits/{branch}', () => {
    const value = 'https://gitlab.com/gitlab-org/gitlab/-/commits/master'
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/gitlab',
      branch: 'master',
    }

    expect(parseGitlabUrl(value)).toEqual(expected)
  })

  it('should return the branch for /-/tree/{branch}', () => {
    const value = 'https://gitlab.com/gitlab-org/gitlab/-/tree/main'
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/gitlab',
      branch: 'main',
    }

    expect(parseGitlabUrl(value)).toEqual(expected)
  })

  it('should return the branch for a nested group project', () => {
    const value = 'https://gitlab.com/gitlab-org/security-products/analyzers/semgrep/-/commits/main'
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/security-products/analyzers/semgrep',
      branch: 'main',
    }

    expect(parseGitlabUrl(value)).toEqual(expected)
  })

  it('should stop the project path at a legacy feature segment', () => {
    const value = 'https://gitlab.com/gitlab-org/security-products/analyzers/semgrep/tree/main'
    const expected: GitlabUrl = {
      kind: 'project',
      namespace: 'gitlab-org',
      projectPath: 'gitlab-org/security-products/analyzers/semgrep',
      branch: 'main',
    }

    expect(parseGitlabUrl(value)).toEqual(expected)
  })

  it('should treat a project named tree as part of the project path', () => {
    const expected: GitlabUrl = { kind: 'project', namespace: 'group', projectPath: 'group/tree' }

    expect(parseGitlabUrl('https://gitlab.com/group/tree')).toEqual(expected)
  })

  const excludedValues: Array<string> = [
    'https://gitlab.com/explore',
    'https://gitlab.com/dashboard',
    'https://gitlab.com/users',
    'https://gitlab.com/search',
    'https://gitlab.com/help',
  ]

  it.each(excludedValues)('should return undefined for %s', (value) => {
    expect(parseGitlabUrl(value)).toBeUndefined()
  })

  const excludedProjectValues: Array<string> = [
    'https://gitlab.com/explore/projects',
    'https://gitlab.com/dashboard/issues',
    'https://gitlab.com/help/docs',
  ]

  it.each(excludedProjectValues)('should return undefined for %s', (value) => {
    expect(parseGitlabUrl(value)).toBeUndefined()
  })

  it('should return undefined for an excluded path in another case', () => {
    expect(parseGitlabUrl('https://gitlab.com/Explore')).toBeUndefined()
  })

  it('should return undefined for a path that starts with the dash separator', () => {
    expect(parseGitlabUrl('https://gitlab.com/-/profile')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseGitlabUrl('https://gitlab.com/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGitlabUrl('not-a-url')).toBeUndefined()
  })
})

describe('gitlabHandler', () => {
  describe('match', () => {
    it('should match a gitlab.com URL without content', () => {
      expect(gitlabHandler.match('https://gitlab.com/gitlab-org')).toBe(true)
    })

    it('should not match a gitlab.com path that resolves to no feed', () => {
      expect(gitlabHandler.match('https://gitlab.com/explore')).toBe(false)
    })

    it('should match self-hosted project path with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user/repo', selfHostedHtml)).toBe(
        true,
      )
    })

    it('should match self-hosted dash path with GitLab HTML', () => {
      const value = 'https://gitlab.mycompany.com/user/repo/-/issues'

      expect(gitlabHandler.match(value, selfHostedHtml)).toBe(true)
    })

    it('should match self-hosted project path with GitLab header', () => {
      const value = 'https://gitlab.mycompany.com/user/repo'

      expect(gitlabHandler.match(value, '', selfHostedHeaders)).toBe(true)
    })

    it('should match self-hosted instance with non-GitLab content but GitLab header', () => {
      const value = 'https://gitlab.mycompany.com/user/repo'
      const content = '<html><head><title>Projects</title></head></html>'

      expect(gitlabHandler.match(value, content, selfHostedHeaders)).toBe(true)
    })

    it('should not match self-hosted single-segment path even with GitLab signals', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', selfHostedHtml)).toBe(false)
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user', '', selfHostedHeaders)).toBe(
        false,
      )
    })

    it('should not match self-hosted without content or headers', () => {
      expect(gitlabHandler.match('https://gitlab.mycompany.com/user/repo')).toBe(false)
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

    it('should return branch commits feed for /-/commits/{branch}', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab/-/commits/master'
      const expected = [
        {
          uri: 'https://gitlab.com/gitlab-org/gitlab/-/commits/master?format=atom',
          hint: { key: 'gitlab:branch-commits', label: 'Branch commits' },
        },
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

    it('should return empty array for excluded paths', () => {
      expect(gitlabHandler.resolve('https://gitlab.com/explore')).toEqual([])
    })

    it('should keep self-hosted origin in resolved feeds', () => {
      const value = 'https://gitlab.mycompany.com/team'
      const expected = [
        {
          uri: 'https://gitlab.mycompany.com/team.atom',
          hint: { key: 'gitlab:activity', label: 'Activity' },
        },
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })
  })
})
