import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { GitlabUrl } from './gitlab.js'
import { gitlabHandler, isGitlabHeaders, isGitlabHtml, parseGitlabUrl } from './gitlab.js'

const selfHostedHtml = `
  <html>
    <head>
      <meta content="GitLab" property="og:site_name">
      <script>window.gon={};gon.features={};</script>
      <script src="/assets/webpack/runtime.ea79027a.bundle.js" defer></script>
    </head>
  </html>
`
const siteNameHtml = '<html><head><meta property="og:site_name" content="GitLab"></head></html>'
const selfHostedHeaders = new Headers({ 'x-gitlab-meta': '{"version":"1"}' })

describe('isGitlabHtml', () => {
  it('should return true for the gon config and the webpack bundles', () => {
    expect(isGitlabHtml(selfHostedHtml)).toBe(true)
  })

  it('should return false for og:site_name GitLab alone', () => {
    expect(isGitlabHtml(siteNameHtml)).toBe(false)
  })

  it('should return false for the gon config without the webpack bundles', () => {
    expect(isGitlabHtml('<script>window.gon={};gon.appConfig={};</script>')).toBe(false)
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

    expect(parseGitlabUrl('https://gitlab.example.com/team')).toEqual(expected)
  })

  it('should return the namespace for a group page under /groups/', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'somegroup' }

    expect(parseGitlabUrl('https://gitlab.com/groups/somegroup')).toEqual(expected)
  })

  it('should return the subgroup for a subgroup page under /groups/', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'somegroup/subgroup' }

    expect(parseGitlabUrl('https://gitlab.com/groups/somegroup/subgroup')).toEqual(expected)
  })

  it('should return the subgroup for a subgroup tab under /groups/', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'somegroup/subgroup' }

    expect(parseGitlabUrl('https://gitlab.com/groups/somegroup/subgroup/-/issues')).toEqual(
      expected,
    )
  })

  it('should return the namespace for a user page under /users/', () => {
    const expected: GitlabUrl = { kind: 'namespace', namespace: 'someone' }

    expect(parseGitlabUrl('https://gitlab.com/users/someone')).toEqual(expected)
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

  it('should return the branch for /-/tree/{branch} with a capitalized tree segment', () => {
    const value = 'https://gitlab.com/gitlab-org/gitlab/-/Tree/main'
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

  it('should stop the project path at a capitalized legacy feature segment', () => {
    const value = 'https://gitlab.com/gitlab-org/security-products/analyzers/semgrep/Tree/main'
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

    it('should not match a guide page on a site named after GitLab', () => {
      const value = 'https://gitlabtips.example.org/guides/ci-cache'
      const content = '<meta property="og:site_name" content="GitLab Tips">'

      expect(gitlabHandler.match(value, content)).toBe(false)
    })

    it('should not match a blog post on a GitLab-owned subdomain', () => {
      const value = 'https://about.gitlab.com/blog/2024/05/01/some-post/'
      const content = '<meta property="og:site_name" content="GitLab">'

      expect(gitlabHandler.match(value, content)).toBe(false)
    })

    it('should match self-hosted project path with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.example.com/user/repo', selfHostedHtml)).toBe(true)
    })

    it('should match self-hosted dash path with GitLab HTML', () => {
      const value = 'https://gitlab.example.com/user/repo/-/issues'

      expect(gitlabHandler.match(value, selfHostedHtml)).toBe(true)
    })

    it('should match self-hosted project path with GitLab header', () => {
      const value = 'https://gitlab.example.com/user/repo'

      expect(gitlabHandler.match(value, '', selfHostedHeaders)).toBe(true)
    })

    it('should match self-hosted instance with non-GitLab content but GitLab header', () => {
      const value = 'https://gitlab.example.com/user/repo'
      const content = '<html><head><title>Projects</title></head></html>'

      expect(gitlabHandler.match(value, content, selfHostedHeaders)).toBe(true)
    })

    it('should match a self-hosted group page with GitLab HTML', () => {
      expect(gitlabHandler.match('https://gitlab.example.com/group', selfHostedHtml)).toBe(true)
    })

    it('should match a self-hosted group page with GitLab header', () => {
      const value = 'https://gitlab.example.com/group'

      expect(gitlabHandler.match(value, '', selfHostedHeaders)).toBe(true)
    })

    it('should not match a self-hosted page with only og:site_name GitLab', () => {
      expect(gitlabHandler.match('https://example.com/group', siteNameHtml)).toBe(false)
      expect(gitlabHandler.match('https://example.com/group/project', siteNameHtml)).toBe(false)
    })

    it('should not match self-hosted without content or headers', () => {
      expect(gitlabHandler.match('https://gitlab.example.com/user/repo')).toBe(false)
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

    it('should keep self-hosted origin in resolved feeds', () => {
      const value = 'https://gitlab.example.com/team'
      const expected = [
        {
          uri: 'https://gitlab.example.com/team.atom',
          hint: { key: 'gitlab:activity', label: 'Activity' },
        },
      ]

      expect(gitlabHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the activity hint for a namespace feed', () => {
      const value = 'https://gitlab.com/0xa.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:activity', label: 'Activity' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for a project feed', () => {
      const value = 'https://gitlab.com/erinapp/erinapp.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:activity', label: 'Activity' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for a subgroup project feed', () => {
      const value = 'https://gitlab.com/alicegroup/software/alice-sdk.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:activity', label: 'Activity' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for a project named with a dot', () => {
      const value = 'https://gitlab.com/dave/dave.net.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:activity', label: 'Activity' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for a project named like a legacy route', () => {
      const value = 'https://gitlab.com/gitlab-org/gitlab/tree.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:activity', label: 'Activity' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the releases hint for a releases feed', () => {
      const value = 'https://gitlab.com/erinapp/erinapp/-/releases.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:releases', label: 'Releases' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the releases hint for a subgroup project releases feed', () => {
      const value = 'https://gitlab.com/alicegroup/software/alice-sdk/-/releases.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:releases', label: 'Releases' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tags hint for a tags feed', () => {
      const value = 'https://gitlab.com/bobgroup/bobapp/-/tags?format=atom'
      const expected: DiscoverUriHint = { key: 'gitlab:tags', label: 'Tags' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the issues hint for an issues feed', () => {
      const value = 'https://gitlab.com/dave/dave.net/-/issues.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:issues', label: 'Issues' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the merge requests hint for a merge requests feed', () => {
      const value = 'https://gitlab.com/bobgroup/bobapp/-/merge_requests.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:merge-requests', label: 'Merge requests' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch commits hint for a branch commits feed', () => {
      const value = 'https://gitlab.com/frank-jp/frankapp/-/commits/master?format=atom'
      const expected: DiscoverUriHint = { key: 'gitlab:branch-commits', label: 'Branch commits' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch commits hint for a commit feed', () => {
      const value =
        'https://gitlab.com/grace-rs/grace-rs/-/commits/0d0335898d117bec60f5a31a207ecceb53beeef6?format=atom'
      const expected: DiscoverUriHint = { key: 'gitlab:branch-commits', label: 'Branch commits' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch commits hint for a commits feed filtered by path', () => {
      const value = 'https://gitlab.com/carol.io/install/-/commits/master/LICENSE?format=atom'
      const expected: DiscoverUriHint = { key: 'gitlab:branch-commits', label: 'Branch commits' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch commits hint for a branch named with a slash', () => {
      const value = 'https://gitlab.com/ns/proj/-/commits/feature/x?format=atom'
      const expected: DiscoverUriHint = { key: 'gitlab:branch-commits', label: 'Branch commits' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the releases hint for a feed on www', () => {
      const value = 'https://www.gitlab.com/erinapp/erinapp/-/releases.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:releases', label: 'Releases' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the issues hint for a feed route in another case', () => {
      const value = 'https://gitlab.com/dave/dave.net/-/Issues.atom'
      const expected: DiscoverUriHint = { key: 'gitlab:issues', label: 'Issues' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tags hint for a format in another case', () => {
      const value = 'https://gitlab.com/bobgroup/bobapp/-/tags?format=Atom'
      const expected: DiscoverUriHint = { key: 'gitlab:tags', label: 'Tags' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for a namespace feed with a trailing slash', () => {
      const value = 'https://gitlab.com/0xa.atom/'
      const expected: DiscoverUriHint = { key: 'gitlab:activity', label: 'Activity' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the activity hint for a project feed with a trailing slash', () => {
      const value = 'https://gitlab.com/erinapp/erinapp.atom/'
      const expected: DiscoverUriHint = { key: 'gitlab:activity', label: 'Activity' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the releases hint for a releases feed with a trailing slash', () => {
      const value = 'https://gitlab.com/erinapp/erinapp/-/releases.atom/'
      const expected: DiscoverUriHint = { key: 'gitlab:releases', label: 'Releases' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tags hint for a tags feed with a trailing slash', () => {
      const value = 'https://gitlab.com/bobgroup/bobapp/-/tags/?format=atom'
      const expected: DiscoverUriHint = { key: 'gitlab:tags', label: 'Tags' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch commits hint for a branch commits feed with a trailing slash', () => {
      const value = 'https://gitlab.com/frank-jp/frankapp/-/commits/master/?format=atom'
      const expected: DiscoverUriHint = { key: 'gitlab:branch-commits', label: 'Branch commits' }

      expect(gitlabHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a project page', () => {
      const value = 'https://gitlab.com/erinapp/erinapp'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a tags page', () => {
      const value = 'https://gitlab.com/bobgroup/bobapp/-/tags'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a branch commits page', () => {
      const value = 'https://gitlab.com/frank-jp/frankapp/-/commits/master'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a project feed path under a namespace alone', () => {
      const value = 'https://gitlab.com/erinapp/-/releases.atom'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed under a project file path', () => {
      const value = 'https://gitlab.com/bobgroup/bobapp/-/blob/main/issues.atom'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a legacy branch commits path', () => {
      const value = 'https://gitlab.com/frank-jp/frankapp/commits/master.atom'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a group page feed', () => {
      const value = 'https://gitlab.com/groups/gitlab-org/-/issues.atom'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a self-hosted feed', () => {
      const value = 'https://gitlab.example.com/team/project/-/releases.atom'

      expect(gitlabHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://gitlab.com/0xa.atom', { key: 'gitlab:activity', label: 'Activity' }],
      ['https://gitlab.com/erinapp/erinapp.atom', { key: 'gitlab:activity', label: 'Activity' }],
      [
        'https://gitlab.com/erinapp/erinapp/-/releases.atom',
        { key: 'gitlab:releases', label: 'Releases' },
      ],
      [
        'https://gitlab.com/bobgroup/bobapp/-/tags?format=atom',
        { key: 'gitlab:tags', label: 'Tags' },
      ],
      ['https://gitlab.com/dave/dave.net/-/issues.atom', { key: 'gitlab:issues', label: 'Issues' }],
      [
        'https://gitlab.com/bobgroup/bobapp/-/merge_requests.atom',
        { key: 'gitlab:merge-requests', label: 'Merge requests' },
      ],
      [
        'https://gitlab.com/frank-jp/frankapp/-/commits/master?format=atom',
        { key: 'gitlab:branch-commits', label: 'Branch commits' },
      ],
      [
        'https://gitlab.com/carol.io/install/-/commits/master/LICENSE?format=atom',
        { key: 'gitlab:branch-commits', label: 'Branch commits' },
      ],
      ['https://gitlab.com/0xa.atom/', { key: 'gitlab:activity', label: 'Activity' }],
      [
        'https://gitlab.com/erinapp/erinapp/-/releases.atom/',
        { key: 'gitlab:releases', label: 'Releases' },
      ],
      [
        'https://gitlab.com/bobgroup/bobapp/-/tags/?format=atom',
        { key: 'gitlab:tags', label: 'Tags' },
      ],
      [
        'https://gitlab.com/frank-jp/frankapp/-/commits/master/?format=atom',
        { key: 'gitlab:branch-commits', label: 'Branch commits' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [gitlabHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
