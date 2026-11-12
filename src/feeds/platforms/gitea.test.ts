import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { GiteaPage, GiteaUrl } from './gitea.js'
import { getGiteaPage, giteaHandler, parseGiteaUrl } from './gitea.js'

const giteaSubPathHtml = `
  <script type="application/json" id="global-window-config">{"appSubUrl":"/gitea","appUrl":"https://example.org/gitea/"}</script>
`

const forgejoSubPathHtml = `
  <script>
    window.config = {
      appUrl: 'https:\\/\\/example.org\\/gitea\\/',
      appSubUrl: '\\/gitea',
    };
  </script>
`

describe('parseGiteaUrl', () => {
  it('should return the user for a user page', () => {
    const expected: GiteaUrl = { kind: 'user', owner: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo')).toEqual(expected)
  })

  it('should return the repo for a repo page', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'forgejo', repo: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo/forgejo')).toEqual(expected)
  })

  it('should return the repo for a repo subpage', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'forgejo', repo: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo/forgejo/issues')).toEqual(expected)
  })

  it('should return the branch path for a branch page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/branch/main'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'main',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the branch and file path for a file page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo/docs/README.md'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'forgejo/docs/README.md',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the branch path for a commit history page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/commits/branch/forgejo'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'forgejo',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the branch and file path for a file history page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/commits/branch/forgejo/README.md'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'forgejo/README.md',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should keep a branch name with a slash whole', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/branch/v11.0/forgejo'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'v11.0/forgejo',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the branch path for capitalized route segments', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/Src/Branch/main'
    const expected: GiteaUrl = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      branchPath: 'main',
    }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the repo without a branch path for a tag page', () => {
    const value = 'https://codeberg.org/forgejo/forgejo/src/tag/v11.0.0'
    const expected: GiteaUrl = { kind: 'repo', owner: 'forgejo', repo: 'forgejo' }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should return the repo on any host', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'owner', repo: 'project' }

    expect(parseGiteaUrl('https://git.example.org/owner/project')).toEqual(expected)
  })

  const userRouteValues: Array<string> = [
    'https://codeberg.org/forgejo.rss',
    'https://codeberg.org/forgejo.atom',
    'https://codeberg.org/forgejo.keys',
    'https://codeberg.org/forgejo.gpg',
    'https://codeberg.org/forgejo.png',
  ]

  it.each(userRouteValues)('should strip the user route suffix from %s', (value) => {
    const expected: GiteaUrl = { kind: 'user', owner: 'forgejo' }

    expect(parseGiteaUrl(value)).toEqual(expected)
  })

  it('should strip the user route suffix in another case', () => {
    const expected: GiteaUrl = { kind: 'user', owner: 'forgejo' }

    expect(parseGiteaUrl('https://codeberg.org/forgejo.RSS')).toEqual(expected)
  })

  it('should keep dots in a username', () => {
    const expected: GiteaUrl = { kind: 'user', owner: 'a.bianco' }

    expect(parseGiteaUrl('https://codeberg.org/a.bianco')).toEqual(expected)
  })

  it('should keep dots in the username of a repo page', () => {
    const expected: GiteaUrl = { kind: 'repo', owner: 'a.bianco', repo: 'notes' }

    expect(parseGiteaUrl('https://codeberg.org/a.bianco/notes')).toEqual(expected)
  })

  it('should return undefined for a route suffix without a user', () => {
    expect(parseGiteaUrl('https://codeberg.org/.rss')).toBeUndefined()
  })

  it('should return undefined for the instance root', () => {
    expect(parseGiteaUrl('https://codeberg.org/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseGiteaUrl('not-a-url')).toBeUndefined()
  })
})

describe('getGiteaPage', () => {
  it('should return the repo from the origin root without content', () => {
    const value = 'https://codeberg.org/forgejo/forgejo'
    const expected: GiteaPage = {
      kind: 'repo',
      owner: 'forgejo',
      repo: 'forgejo',
      root: 'https://codeberg.org',
    }

    expect(getGiteaPage(value, undefined)).toEqual(expected)
  })

  it('should read the sub-path from the Gitea window config', () => {
    const value = 'https://example.org/gitea/owner/project'
    const expected: GiteaPage = {
      kind: 'repo',
      owner: 'owner',
      repo: 'project',
      root: 'https://example.org/gitea',
    }

    expect(getGiteaPage(value, giteaSubPathHtml)).toEqual(expected)
  })

  it('should read the escaped sub-path from the Forgejo window config', () => {
    const value = 'https://example.org/gitea/owner'
    const expected: GiteaPage = { kind: 'user', owner: 'owner', root: 'https://example.org/gitea' }

    expect(getGiteaPage(value, forgejoSubPathHtml)).toEqual(expected)
  })

  it('should return undefined for the root of an install under a sub-path', () => {
    expect(getGiteaPage('https://example.org/gitea/', giteaSubPathHtml)).toBeUndefined()
  })

  it('should return undefined for a path outside the sub-path', () => {
    expect(getGiteaPage('https://example.org/gitea2/owner', giteaSubPathHtml)).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(getGiteaPage('not-a-url', giteaSubPathHtml)).toBeUndefined()
  })
})

describe('giteaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://codeberg.org/forgejo'],
      [true, 'https://www.codeberg.org/forgejo'],
      [true, 'https://gitea.com/gitea'],
      [true, 'https://www.gitea.com/gitea'],
      [false, 'https://example.org/user/repo'],
      [false, 'https://example.com/owner'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(giteaHandler.match(url)).toBe(expected)
    })

    it('should match a self-hosted instance by the session cookie', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'i_like_gitea=abc123; Path=/; HttpOnly' })

      expect(giteaHandler.match(value, '', headers)).toBe(true)
    })

    it('should not match a self-hosted instance without the cookie', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'session=abc123; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(false)
      expect(giteaHandler.match(value)).toBe(false)
    })

    it('should match a renamed session cookie', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'example-gitea=abc123; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(true)
    })

    it('should not match a cookie whose name only starts with the marker', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'gitea_theme=dark; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(false)
    })

    it('should not match the root of an install under a sub-path', () => {
      const value = 'https://example.org/gitea/'
      const headers = new Headers({ 'set-cookie': 'i_like_gitea=abc123; Path=/gitea' })

      expect(giteaHandler.match(value, giteaSubPathHtml, headers)).toBe(false)
    })

    it('should not match the marker inside a cookie value', () => {
      const value = 'https://git.example.org/owner/project'
      const headers = new Headers({ 'set-cookie': 'session=i_like_gitea=abc123; Path=/' })

      expect(giteaHandler.match(value, '', headers)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return activity feed for user page', () => {
      const value = 'https://codeberg.org/forgejo'
      const expected = [
        {
          uri: ['https://codeberg.org/forgejo.atom', 'https://codeberg.org/forgejo.rss'],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return releases, tags, and activity feeds for repo page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for gitea.com', () => {
      const value = 'https://gitea.com/gitea/go-sdk'
      const expected = [
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/releases.atom',
            'https://gitea.com/gitea/go-sdk/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://gitea.com/gitea/go-sdk/tags.atom',
            'https://gitea.com/gitea/go-sdk/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: ['https://gitea.com/gitea/go-sdk.atom', 'https://gitea.com/gitea/go-sdk.rss'],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return the branch commits feed first for a branch page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/atom/branch/forgejo',
            'https://codeberg.org/forgejo/forgejo/rss/branch/forgejo',
          ],
          hint: { key: 'gitea:branch-commits', label: 'Branch commits' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })

    it('should return the file history feed first for a file page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo/README.md'
      const expected = [
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/atom/branch/forgejo/README.md',
            'https://codeberg.org/forgejo/forgejo/rss/branch/forgejo/README.md',
          ],
          hint: { key: 'gitea:file-history', label: 'File history' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/releases.atom',
            'https://codeberg.org/forgejo/forgejo/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo/tags.atom',
            'https://codeberg.org/forgejo/forgejo/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://codeberg.org/forgejo/forgejo.atom',
            'https://codeberg.org/forgejo/forgejo.rss',
          ],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('resolve under a sub-path', () => {
    it('should build the feeds from the install root', () => {
      const value = 'https://example.org/gitea/owner/project'
      const expected = [
        {
          uri: [
            'https://example.org/gitea/owner/project/releases.atom',
            'https://example.org/gitea/owner/project/releases.rss',
          ],
          hint: { key: 'gitea:releases', label: 'Releases' },
        },
        {
          uri: [
            'https://example.org/gitea/owner/project/tags.atom',
            'https://example.org/gitea/owner/project/tags.rss',
          ],
          hint: { key: 'gitea:tags', label: 'Tags' },
        },
        {
          uri: [
            'https://example.org/gitea/owner/project.atom',
            'https://example.org/gitea/owner/project.rss',
          ],
          hint: { key: 'gitea:activity', label: 'Activity' },
        },
      ]

      expect(giteaHandler.resolve(value, giteaSubPathHtml)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the activity key for a user Atom feed', () => {
      const value = 'https://codeberg.org/forgejo.atom'
      const expected = 'gitea:activity'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the activity key for a user RSS feed', () => {
      const value = 'https://codeberg.org/forgejo.rss'
      const expected = 'gitea:activity'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the activity key for a repo Atom feed', () => {
      const value = 'https://gitea.com/gitea/blog.atom'
      const expected = 'gitea:activity'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the activity key for a repo RSS feed', () => {
      const value = 'https://gitea.com/gitea/go-sdk.rss'
      const expected = 'gitea:activity'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the releases key for a releases Atom feed', () => {
      const value = 'https://gitea.com/gitea/blog/releases.atom'
      const expected = 'gitea:releases'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the releases key for a releases RSS feed', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/releases.rss'
      const expected = 'gitea:releases'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tags key for a tags Atom feed', () => {
      const value = 'https://gitea.com/gitea/blog/tags.atom'
      const expected = 'gitea:tags'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tags key for a tags RSS feed', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/tags.rss'
      const expected = 'gitea:tags'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the branch commits key for a branch Atom feed', () => {
      const value = 'https://gitea.com/noerw/tea/atom/branch/print-issue-label'
      const expected = 'gitea:branch-commits'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the branch commits key for a branch RSS feed', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/rss/branch/forgejo'
      const expected = 'gitea:branch-commits'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the file history key for a file history feed', () => {
      const value = 'https://gitea.com/noerw/unidiff-comments/atom/branch/master/types/hunk.go'
      const expected = 'gitea:file-history'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the file history key for a folder history feed', () => {
      const value = 'https://gitea.com/jolheiser/theme/atom/branch/master/i18n'
      const expected = 'gitea:file-history'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the file history key for a percent-encoded file path', () => {
      const value =
        'https://gitea.com/CyberShell/Health-PDFS/atom/branch/master/Vaccine-Binder-Research.zip%20%28Unzipped%20Files%29/Vaccine-Binder-Research'
      const expected = 'gitea:file-history'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the file history key for a branch named with a slash', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/atom/branch/v11.0/forgejo'
      const expected = 'gitea:file-history'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the releases key for a feed on www', () => {
      const value = 'https://www.codeberg.org/forgejo/forgejo/releases.atom'
      const expected = 'gitea:releases'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the branch commits key for feed routes in another case', () => {
      const value = 'https://gitea.com/noerw/tea/Atom/Branch/print-issue-label'
      const expected = 'gitea:branch-commits'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the activity key for a user feed with a trailing slash', () => {
      const value = 'https://codeberg.org/forgejo.atom/'
      const expected = 'gitea:activity'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the activity key for a repo feed with a trailing slash', () => {
      const value = 'https://gitea.com/gitea/go-sdk.rss/'
      const expected = 'gitea:activity'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the releases key for a releases feed with a trailing slash', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/releases.rss/'
      const expected = 'gitea:releases'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tags key for a tags feed with a trailing slash', () => {
      const value = 'https://gitea.com/gitea/blog/tags.atom/'
      const expected = 'gitea:tags'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the branch commits key for a branch feed with a trailing slash', () => {
      const value = 'https://gitea.com/noerw/tea/atom/branch/print-issue-label/'
      const expected = 'gitea:branch-commits'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the file history key for a file history feed with a trailing slash', () => {
      const value = 'https://gitea.com/noerw/unidiff-comments/atom/branch/master/types/hunk.go/'
      const expected = 'gitea:file-history'

      expect(giteaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user page', () => {
      const value = 'https://codeberg.org/forgejo'

      expect(giteaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a repo page', () => {
      const value = 'https://gitea.com/gitea/blog'

      expect(giteaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a releases page', () => {
      const value = 'https://gitea.com/gitea/blog/releases'

      expect(giteaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a branch page', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo'

      expect(giteaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a branch feed route without a branch', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/atom/branch'

      expect(giteaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a file named like a feed under a branch', () => {
      const value = 'https://codeberg.org/forgejo/forgejo/src/branch/forgejo/releases.atom'

      expect(giteaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a self-hosted feed', () => {
      const value = 'https://git.example.org/owner/project/releases.atom'

      expect(giteaHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://codeberg.org/forgejo.atom', { key: 'gitea:activity', label: 'Activity' }],
      ['https://gitea.com/gitea/blog.atom', { key: 'gitea:activity', label: 'Activity' }],
      ['https://gitea.com/gitea/blog/releases.atom', { key: 'gitea:releases', label: 'Releases' }],
      ['https://gitea.com/gitea/blog/tags.atom', { key: 'gitea:tags', label: 'Tags' }],
      [
        'https://gitea.com/noerw/tea/atom/branch/print-issue-label',
        { key: 'gitea:branch-commits', label: 'Branch commits' },
      ],
      [
        'https://gitea.com/noerw/unidiff-comments/atom/branch/master/types/hunk.go',
        { key: 'gitea:file-history', label: 'File history' },
      ],
      ['https://codeberg.org/forgejo.atom/', { key: 'gitea:activity', label: 'Activity' }],
      ['https://gitea.com/gitea/blog/releases.atom/', { key: 'gitea:releases', label: 'Releases' }],
      [
        'https://gitea.com/noerw/tea/atom/branch/print-issue-label/',
        { key: 'gitea:branch-commits', label: 'Branch commits' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [giteaHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
