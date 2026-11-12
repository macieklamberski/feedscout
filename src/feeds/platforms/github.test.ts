import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { GithubUrl } from './github.js'
import { githubHandler, parseGithubUrl } from './github.js'

describe('parseGithubUrl', () => {
  it('should return the owner for a profile page', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'microsoft' }

    expect(parseGithubUrl('https://github.com/microsoft')).toEqual(expected)
  })

  it('should return the owner for a name with dashes', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'my-org' }

    expect(parseGithubUrl('https://github.com/my-org')).toEqual(expected)
  })

  it('should keep the owner case', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'Octocat' }

    expect(parseGithubUrl('https://github.com/Octocat')).toEqual(expected)
  })

  it('should return the owner for the www host', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'octocat' }

    expect(parseGithubUrl('https://www.github.com/octocat')).toEqual(expected)
  })

  const routeSuffixValues: Array<string> = [
    'https://github.com/octocat.atom',
    'https://github.com/octocat.png',
  ]

  it.each(routeSuffixValues)('should strip the route suffix from %s', (value) => {
    const expected: GithubUrl = { kind: 'user', owner: 'octocat' }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  it('should return the repo for a repository page', () => {
    const expected: GithubUrl = { kind: 'repo', owner: 'octocat', repo: 'Hello-World' }

    expect(parseGithubUrl('https://github.com/octocat/Hello-World')).toEqual(expected)
  })

  it('should return the repo for a repository subpage', () => {
    const value = 'https://github.com/octocat/Hello-World/tree/main/src'
    const expected: GithubUrl = { kind: 'repo', owner: 'octocat', repo: 'Hello-World' }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  it('should keep a URL-encoded repo name', () => {
    const expected: GithubUrl = { kind: 'repo', owner: 'owner', repo: 'my%20repo' }

    expect(parseGithubUrl('https://github.com/owner/my%20repo')).toEqual(expected)
  })

  it('should return the org for an organization discussions page', () => {
    const expected: GithubUrl = { kind: 'discussions', org: 'acme' }

    expect(parseGithubUrl('https://github.com/orgs/acme/discussions')).toEqual(expected)
  })

  it('should return the org and category for an organization discussion category', () => {
    const value = 'https://github.com/orgs/acme/discussions/categories/announcements'
    const expected: GithubUrl = {
      kind: 'discussions',
      org: 'acme',
      discussionCategory: 'announcements',
    }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  it('should return the wiki section of a repository', () => {
    const expected: GithubUrl = { kind: 'repo', owner: 'acme', repo: 'app', section: 'wiki' }

    expect(parseGithubUrl('https://github.com/acme/app/Wiki/Home')).toEqual(expected)
  })

  it('should return the discussion category of a repository', () => {
    const value = 'https://github.com/acme/app/discussions/categories/q-a'
    const expected: GithubUrl = {
      kind: 'repo',
      owner: 'acme',
      repo: 'app',
      section: 'discussions',
      discussionCategory: 'q-a',
    }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  it('should return the branch of a repository tree page', () => {
    const expected: GithubUrl = { kind: 'repo', owner: 'acme', repo: 'app', branch: 'dev' }

    expect(parseGithubUrl('https://github.com/acme/app/tree/dev')).toEqual(expected)
  })

  it('should return the branch of a branch commit history page', () => {
    const expected: GithubUrl = { kind: 'repo', owner: 'acme', repo: 'app', branch: 'dev' }

    expect(parseGithubUrl('https://github.com/acme/app/commits/dev')).toEqual(expected)
  })

  it('should return the file of a repository blob page', () => {
    const value = 'https://github.com/acme/app/blob/main/src/index.ts'
    const expected: GithubUrl = {
      kind: 'repo',
      owner: 'acme',
      repo: 'app',
      file: { branch: 'main', path: 'src/index.ts' },
    }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  const capitalizedRouteValues: Array<string> = [
    'https://github.com/Orgs/acme/discussions',
    'https://github.com/orgs/acme/Discussions',
  ]

  it.each(capitalizedRouteValues)('should return the org for %s', (value) => {
    const expected: GithubUrl = { kind: 'discussions', org: 'acme' }

    expect(parseGithubUrl(value)).toEqual(expected)
  })

  it('should keep the org case', () => {
    const expected: GithubUrl = { kind: 'discussions', org: 'Acme' }

    expect(parseGithubUrl('https://github.com/orgs/Acme/discussions')).toEqual(expected)
  })

  it('should return the owner for an organization page', () => {
    const expected: GithubUrl = { kind: 'user', owner: 'someorg' }

    expect(parseGithubUrl('https://github.com/orgs/someorg')).toEqual(expected)
  })

  const dottedSegmentValues: Array<string> = [
    'https://github.com/robots.txt',
    'https://github.com/octo.cat/hello-world',
  ]

  it.each(dottedSegmentValues)('should return undefined for a dotted first segment %s', (value) => {
    expect(parseGithubUrl(value)).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseGithubUrl('https://github.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGithubUrl('https://example.com/owner/repo')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGithubUrl('not-a-url')).toBeUndefined()
  })
})

describe('githubHandler', () => {
  describe('match', () => {
    it('should match a GitHub URL', () => {
      expect(githubHandler.match('https://github.com/owner/repo')).toBe(true)
    })

    it('should not match another host', () => {
      expect(githubHandler.match('https://example.com/owner/repo')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the wiki feed for a capitalized wiki segment', () => {
      const value = 'https://github.com/microsoft/vscode/Wiki'
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

    it('should not return the wiki feed for a repository named wiki', () => {
      const value = 'https://github.com/owner/Wiki'
      const expected = [
        {
          uri: 'https://github.com/owner/Wiki/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/owner/Wiki/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/owner/Wiki/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should not return the discussions feed for a repository named discussions', () => {
      const value = 'https://github.com/owner/Discussions'
      const expected = [
        {
          uri: 'https://github.com/owner/Discussions/releases.atom',
          hint: { key: 'github:releases', label: 'Releases' },
        },
        {
          uri: 'https://github.com/owner/Discussions/commits.atom',
          hint: { key: 'github:commits', label: 'Commits' },
        },
        {
          uri: 'https://github.com/owner/Discussions/tags.atom',
          hint: { key: 'github:tags', label: 'Tags' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

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

    it('should include branch-specific commits feed when on branch page with a capitalized tree segment', () => {
      const value = 'https://github.com/microsoft/vscode/Tree/main'
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

    it('should not include branch commits feed for tree path with subdirectory', () => {
      const value = 'https://github.com/microsoft/vscode/tree/main/src'
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

    it('should include discussions feed when on discussions page with a capitalized discussions segment', () => {
      const value = 'https://github.com/microsoft/vscode/Discussions'
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

    it('should include category-scoped discussion feed when on category page', () => {
      const value = 'https://github.com/microsoft/vscode/discussions/categories/announcements'
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
        {
          uri: 'https://github.com/microsoft/vscode/discussions/categories/announcements.atom',
          hint: { key: 'github:discussion-category', label: 'Discussion category' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include category-scoped discussion feed when on category page with a capitalized categories segment', () => {
      const value = 'https://github.com/microsoft/vscode/discussions/Categories/announcements'
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
        {
          uri: 'https://github.com/microsoft/vscode/discussions/categories/announcements.atom',
          hint: { key: 'github:discussion-category', label: 'Discussion category' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should return the discussions feed for an organization discussions page', () => {
      const value = 'https://github.com/orgs/acme/discussions'
      const expected = [
        {
          uri: 'https://github.com/orgs/acme/discussions.atom',
          hint: { key: 'github:discussions', label: 'Discussions' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include category-scoped discussion feed when on organization category page', () => {
      const value = 'https://github.com/orgs/acme/discussions/categories/announcements'
      const expected = [
        {
          uri: 'https://github.com/orgs/acme/discussions.atom',
          hint: { key: 'github:discussions', label: 'Discussions' },
        },
        {
          uri: 'https://github.com/orgs/acme/discussions/categories/announcements.atom',
          hint: { key: 'github:discussion-category', label: 'Discussion category' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    it('should include category-scoped discussion feed when on organization category page with a capitalized categories segment', () => {
      const value = 'https://github.com/orgs/acme/discussions/Categories/announcements'
      const expected = [
        {
          uri: 'https://github.com/orgs/acme/discussions.atom',
          hint: { key: 'github:discussions', label: 'Discussions' },
        },
        {
          uri: 'https://github.com/orgs/acme/discussions/categories/announcements.atom',
          hint: { key: 'github:discussion-category', label: 'Discussion category' },
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

    it('should return the owner activity feed for an organization page', () => {
      const value = 'https://github.com/orgs/someorg'
      const expected = [
        {
          uri: 'https://github.com/someorg.atom',
          hint: { key: 'github:activity', label: 'Activity' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
    })

    const routeSuffixValues: Array<string> = [
      'https://github.com/torvalds.atom',
      'https://github.com/torvalds.png',
    ]

    it.each(routeSuffixValues)('should return the user activity feed for %s', (value) => {
      const expected = [
        {
          uri: 'https://github.com/torvalds.atom',
          hint: { key: 'github:activity', label: 'Activity' },
        },
      ]

      expect(githubHandler.resolve(value)).toEqual(expected)
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

    it('should include file-specific commits feed when viewing a file with a capitalized blob segment', () => {
      const value = 'https://github.com/anthropics/sdk/Blob/main/src/index.ts'
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

  describe('getFeedHint', () => {
    it('should return the activity hint for a user feed', () => {
      const value = 'https://github.com/a99f.atom'
      const expected: DiscoverUriHint = { key: 'github:activity', label: 'Activity' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the releases hint for a releases feed', () => {
      const value = 'https://github.com/BishopFox/sliver/releases.atom'
      const expected: DiscoverUriHint = { key: 'github:releases', label: 'Releases' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the commits hint for a commits feed', () => {
      const value = 'https://github.com/BishopFox/sliver/commits.atom'
      const expected: DiscoverUriHint = { key: 'github:commits', label: 'Commits' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tags hint for a tags feed', () => {
      const value = 'https://github.com/BishopFox/sliver/tags.atom'
      const expected: DiscoverUriHint = { key: 'github:tags', label: 'Tags' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the wiki hint for a wiki feed', () => {
      const value = 'https://github.com/BishopFox/sliver/wiki.atom'
      const expected: DiscoverUriHint = { key: 'github:wiki', label: 'Wiki' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the wiki hint for the wiki feed of a repository named wiki', () => {
      const value = 'https://github.com/ethereum/wiki/wiki.atom'
      const expected: DiscoverUriHint = { key: 'github:wiki', label: 'Wiki' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussions hint for a repository discussions feed', () => {
      const value = 'https://github.com/MusicPlayerDaemon/MPD/discussions.atom'
      const expected: DiscoverUriHint = { key: 'github:discussions', label: 'Discussions' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussions hint for an organization discussions feed', () => {
      const value = 'https://github.com/orgs/community/discussions.atom'
      const expected: DiscoverUriHint = { key: 'github:discussions', label: 'Discussions' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussion category hint for a repository category feed', () => {
      const value =
        'https://github.com/Security-Onion-Solutions/securityonion/discussions/categories/quick-malware-analysis.atom'
      const expected: DiscoverUriHint = {
        key: 'github:discussion-category',
        label: 'Discussion category',
      }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussion category hint for an organization category feed', () => {
      const value = 'https://github.com/orgs/community/discussions/categories/github-education.atom'
      const expected: DiscoverUriHint = {
        key: 'github:discussion-category',
        label: 'Discussion category',
      }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch commits hint for a branch commits feed', () => {
      const value = 'https://github.com/microsoft/vscode/commits/main.atom'
      const expected: DiscoverUriHint = { key: 'github:branch-commits', label: 'Branch commits' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the file history hint for a file at the repository root', () => {
      const value = 'https://github.com/hajimehoshi/ebiten/commits/main/LICENSE.atom'
      const expected: DiscoverUriHint = { key: 'github:file-history', label: 'File history' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the file history hint for a nested file', () => {
      const value =
        'https://github.com/combine-org/combine-specifications/commits/main/specifications/sbml.level-3.version-1.render.version-1.release-1.md.atom'
      const expected: DiscoverUriHint = { key: 'github:file-history', label: 'File history' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the file history hint for a feed with a trailing slash', () => {
      const value = 'https://github.com/hajimehoshi/ebiten/commits/main/LICENSE.atom/'
      const expected: DiscoverUriHint = { key: 'github:file-history', label: 'File history' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the file history hint for a feed on the www host', () => {
      const value = 'https://www.github.com/hajimehoshi/ebiten/commits/main/LICENSE.atom'
      const expected: DiscoverUriHint = { key: 'github:file-history', label: 'File history' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the wiki hint for a feed on the www host', () => {
      const value = 'https://www.github.com/BishopFox/sliver/wiki.atom'
      const expected: DiscoverUriHint = { key: 'github:wiki', label: 'Wiki' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discussions hint for a feed with a capitalized route', () => {
      const value = 'https://github.com/Orgs/community/Discussions.atom'
      const expected: DiscoverUriHint = { key: 'github:discussions', label: 'Discussions' }

      expect(githubHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a repository page', () => {
      const value = 'https://github.com/BishopFox/sliver'

      expect(githubHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a wiki page', () => {
      const value = 'https://github.com/BishopFox/sliver/wiki'

      expect(githubHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a file blob page', () => {
      const value = 'https://github.com/hajimehoshi/ebiten/blob/main/LICENSE'

      expect(githubHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a file history page', () => {
      const value = 'https://github.com/hajimehoshi/ebiten/commits/main/LICENSE'

      expect(githubHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a file history feed on another host', () => {
      const value = 'https://example.com/hajimehoshi/ebiten/commits/main/LICENSE.atom'

      expect(githubHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/BishopFox/sliver/wiki.atom'

      expect(githubHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://github.com/a99f.atom', { key: 'github:activity', label: 'Activity' }],
      [
        'https://github.com/BishopFox/sliver/releases.atom',
        { key: 'github:releases', label: 'Releases' },
      ],
      [
        'https://github.com/BishopFox/sliver/commits.atom',
        { key: 'github:commits', label: 'Commits' },
      ],
      ['https://github.com/BishopFox/sliver/tags.atom', { key: 'github:tags', label: 'Tags' }],
      ['https://github.com/BishopFox/sliver/wiki.atom', { key: 'github:wiki', label: 'Wiki' }],
      [
        'https://github.com/MusicPlayerDaemon/MPD/discussions.atom',
        { key: 'github:discussions', label: 'Discussions' },
      ],
      [
        'https://github.com/orgs/community/discussions.atom',
        { key: 'github:discussions', label: 'Discussions' },
      ],
      [
        'https://github.com/Security-Onion-Solutions/securityonion/discussions/categories/quick-malware-analysis.atom',
        { key: 'github:discussion-category', label: 'Discussion category' },
      ],
      [
        'https://github.com/orgs/community/discussions/categories/github-education.atom',
        { key: 'github:discussion-category', label: 'Discussion category' },
      ],
      [
        'https://github.com/microsoft/vscode/commits/main.atom',
        { key: 'github:branch-commits', label: 'Branch commits' },
      ],
      [
        'https://github.com/hajimehoshi/ebiten/commits/main/LICENSE.atom',
        { key: 'github:file-history', label: 'File history' },
      ],
      [
        'https://github.com/combine-org/combine-specifications/commits/main/specifications/sbml.level-3.version-1.render.version-1.release-1.md.atom',
        { key: 'github:file-history', label: 'File history' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [githubHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
