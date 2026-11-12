import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type LaunchpadUrl, launchpadHandler, parseLaunchpadUrl } from './launchpad.js'

describe('parseLaunchpadUrl', () => {
  it('should return the home page of the main site', () => {
    const expected: LaunchpadUrl = { kind: 'home', application: 'main' }

    expect(parseLaunchpadUrl('https://launchpad.net/')).toEqual(expected)
  })

  it('should return the home page of Bugs', () => {
    const expected: LaunchpadUrl = { kind: 'home', application: 'bugs' }

    expect(parseLaunchpadUrl('https://bugs.launchpad.net/')).toEqual(expected)
  })

  it('should return undefined for the home page of Code', () => {
    expect(parseLaunchpadUrl('https://code.launchpad.net/')).toBeUndefined()
  })

  it('should return the bug for a bug page', () => {
    const expected: LaunchpadUrl = { kind: 'bug', bugId: '1' }

    expect(parseLaunchpadUrl('https://bugs.launchpad.net/ubuntu/+bug/1')).toEqual(expected)
  })

  it('should return the branch for a branch page', () => {
    const value = 'https://code.launchpad.net/~bzr-pqm/bzr/bzr.dev'
    const expected: LaunchpadUrl = {
      kind: 'branch',
      owner: 'bzr-pqm',
      project: 'bzr',
      branch: 'bzr.dev',
    }

    expect(parseLaunchpadUrl(value)).toEqual(expected)
  })

  it('should return the branch for a source package branch page', () => {
    const value = 'https://code.launchpad.net/~example/distro/series/package/branch'
    const expected: LaunchpadUrl = {
      kind: 'branch',
      owner: 'example',
      distribution: 'distro',
      series: 'series',
      sourcePackage: 'package',
      branch: 'branch',
    }

    expect(parseLaunchpadUrl(value)).toEqual(expected)
  })

  it('should return the source package for a source package page', () => {
    const value = 'https://bugs.launchpad.net/ubuntu/+source/bash'
    const expected: LaunchpadUrl = {
      kind: 'sourcePackage',
      distribution: 'ubuntu',
      sourcePackage: 'bash',
    }

    expect(parseLaunchpadUrl(value)).toEqual(expected)
  })

  it('should return the person with the application of its host', () => {
    const expected: LaunchpadUrl = { kind: 'person', application: 'code', username: 'cjwatson' }

    expect(parseLaunchpadUrl('https://code.launchpad.net/~cjwatson')).toEqual(expected)
  })

  it('should return the project with the application of its host', () => {
    const expected: LaunchpadUrl = { kind: 'project', application: 'main', project: 'launchpad' }

    expect(parseLaunchpadUrl('https://launchpad.net/launchpad')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseLaunchpadUrl('https://example.com/launchpad')).toBeUndefined()
  })
})

describe('launchpadHandler', () => {
  describe('match', () => {
    it('should match a project page', () => {
      expect(launchpadHandler.match('https://launchpad.net/example')).toBe(true)
    })

    it('should match a person page', () => {
      expect(launchpadHandler.match('https://launchpad.net/~example')).toBe(true)
    })

    it('should match a bug page', () => {
      expect(launchpadHandler.match('https://bugs.launchpad.net/example/+bug/123')).toBe(true)
    })

    it('should match a bug page by bug number', () => {
      expect(launchpadHandler.match('https://bugs.launchpad.net/bugs/123')).toBe(true)
    })

    it('should match a bug comment below a source package bug', () => {
      const value = 'https://bugs.launchpad.net/example/+source/package/+bug/123/comments/4'

      expect(launchpadHandler.match(value)).toBe(true)
    })

    it('should match a source package page', () => {
      expect(launchpadHandler.match('https://bugs.launchpad.net/example/+source/package')).toBe(
        true,
      )
    })

    it('should match a Bazaar branch page', () => {
      expect(launchpadHandler.match('https://code.launchpad.net/~example/project/trunk')).toBe(true)
    })

    it('should match a source package branch page', () => {
      const value = 'https://code.launchpad.net/~example/distro/series/package/branch'

      expect(launchpadHandler.match(value)).toBe(true)
    })

    it('should match the home page', () => {
      expect(launchpadHandler.match('https://launchpad.net/')).toBe(true)
    })

    it('should match the bugs home page', () => {
      expect(launchpadHandler.match('https://bugs.launchpad.net/')).toBe(true)
    })

    it('should not match the code home page', () => {
      expect(launchpadHandler.match('https://code.launchpad.net/')).toBe(false)
    })

    it('should not match a Git repository page', () => {
      const value = 'https://code.launchpad.net/~example/project/+git/project'

      expect(launchpadHandler.match(value)).toBe(false)
    })

    it('should not match a person project page on the code host', () => {
      const value = 'https://code.launchpad.net/~example/project'

      expect(launchpadHandler.match(value)).toBe(false)
    })

    it('should not match a merge proposal page', () => {
      const value = 'https://code.launchpad.net/~example/project/trunk/+merge/123'

      expect(launchpadHandler.match(value)).toBe(false)
    })

    it('should not match a person subpage', () => {
      expect(launchpadHandler.match('https://launchpad.net/~example/+archive')).toBe(false)
    })

    it('should not match a bare tilde', () => {
      expect(launchpadHandler.match('https://launchpad.net/~')).toBe(false)
    })

    it('should not match a plus-prefixed top-level route', () => {
      expect(launchpadHandler.match('https://launchpad.net/+login')).toBe(false)
    })

    it('should not match a project subpage', () => {
      expect(launchpadHandler.match('https://launchpad.net/example/+milestones')).toBe(false)
    })

    it('should not match a bug path without a number', () => {
      expect(launchpadHandler.match('https://bugs.launchpad.net/example/+bug/abc')).toBe(false)
    })

    it('should not match a bug route on the code host', () => {
      expect(launchpadHandler.match('https://code.launchpad.net/bugs/123')).toBe(false)
    })

    it('should not match a source package on the code host', () => {
      const value = 'https://code.launchpad.net/example/+source/package'

      expect(launchpadHandler.match(value)).toBe(false)
    })

    it('should not match a project on the answers host', () => {
      expect(launchpadHandler.match('https://answers.launchpad.net/example')).toBe(false)
    })

    it('should not match another host', () => {
      expect(launchpadHandler.match('https://example.com/~example')).toBe(false)
    })

    it('should not match an invalid URL', () => {
      expect(launchpadHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Launchpad', () => {
      expect(launchpadHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the site announcements for the home page', () => {
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/announcements.atom',
          hint: { key: 'launchpad:announcements', label: 'Announcements' },
        },
      ]

      expect(launchpadHandler.resolve('https://launchpad.net/')).toEqual(expected)
    })

    it('should return the site latest bugs for the bugs home page', () => {
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/bugs/latest-bugs.atom',
          hint: { key: 'launchpad:bugs', label: 'Latest bugs' },
        },
      ]

      expect(launchpadHandler.resolve('https://bugs.launchpad.net/')).toEqual(expected)
    })

    it('should return every project feed for a project page', () => {
      const value = 'https://launchpad.net/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://feeds.launchpad.net/example/announcements.atom',
          hint: { key: 'launchpad:project-announcements', label: 'Project announcements' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/latest-bugs.atom',
          hint: { key: 'launchpad:project-bugs', label: 'Project latest bugs' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/branches.atom',
          hint: { key: 'launchpad:project-branches', label: 'Project branches' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/revisions.atom',
          hint: { key: 'launchpad:project-revisions', label: 'Project revisions' },
        },
      ]

      expect(launchpadHandler.resolve(value)).toEqual(expected)
    })

    it('should return the latest bugs for a project on the bugs host', () => {
      const value = 'https://bugs.launchpad.net/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://feeds.launchpad.net/example/latest-bugs.atom',
          hint: { key: 'launchpad:project-bugs', label: 'Project latest bugs' },
        },
      ]

      expect(launchpadHandler.resolve(value)).toEqual(expected)
    })

    it('should return the code feeds for a project on the code host', () => {
      const value = 'https://code.launchpad.net/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://feeds.launchpad.net/example/branches.atom',
          hint: { key: 'launchpad:project-branches', label: 'Project branches' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/revisions.atom',
          hint: { key: 'launchpad:project-revisions', label: 'Project revisions' },
        },
      ]

      expect(launchpadHandler.resolve(value)).toEqual(expected)
    })

    it('should return the person feeds for a person page', () => {
      const value = 'https://launchpad.net/~example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://feeds.launchpad.net/~example/latest-bugs.atom',
          hint: { key: 'launchpad:person-bugs', label: 'Person latest bugs' },
        },
        {
          uri: 'http://feeds.launchpad.net/~example/branches.atom',
          hint: { key: 'launchpad:person-branches', label: 'Person branches' },
        },
        {
          uri: 'http://feeds.launchpad.net/~example/revisions.atom',
          hint: { key: 'launchpad:person-revisions', label: 'Person revisions' },
        },
      ]

      expect(launchpadHandler.resolve(value)).toEqual(expected)
    })

    it('should return the bug feed for a bug page', () => {
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/bugs/123/bug.atom',
          hint: { key: 'launchpad:bug', label: 'Bug' },
        },
      ]

      expect(launchpadHandler.resolve('https://bugs.launchpad.net/example/+bug/123')).toEqual(
        expected,
      )
    })

    it('should return the package latest bugs for a source package page', () => {
      const value = 'https://bugs.launchpad.net/example/+source/package'
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/example/+source/package/latest-bugs.atom',
          hint: { key: 'launchpad:bugs', label: 'Latest bugs' },
        },
      ]

      expect(launchpadHandler.resolve(value)).toEqual(expected)
    })

    it('should return the branch feed for a Bazaar branch page', () => {
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/~example/project/trunk/branch.atom',
          hint: { key: 'launchpad:branch', label: 'Branch' },
        },
      ]

      expect(launchpadHandler.resolve('https://code.launchpad.net/~example/project/trunk')).toEqual(
        expected,
      )
    })

    it('should return the branch feed for a source package branch page', () => {
      const value = 'https://code.launchpad.net/~example/distro/series/package/branch'
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/~example/distro/series/package/branch/branch.atom',
          hint: { key: 'launchpad:branch', label: 'Branch' },
        },
      ]

      expect(launchpadHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the announcements key for the site announcements feed', () => {
      const value = 'http://feeds.launchpad.net/announcements.atom'
      const expected: DiscoverUriHint = { key: 'launchpad:announcements', label: 'Announcements' }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project announcements key for a project announcements feed', () => {
      const value = 'http://feeds.launchpad.net/example/announcements.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:project-announcements',
        label: 'Project announcements',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project announcements key for a project announcements feed over https', () => {
      const value = 'https://feeds.launchpad.net/example/announcements.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:project-announcements',
        label: 'Project announcements',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the bugs key for the site latest bugs feed', () => {
      const value = 'http://feeds.launchpad.net/bugs/latest-bugs.atom'
      const expected: DiscoverUriHint = { key: 'launchpad:bugs', label: 'Latest bugs' }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project bugs key for a project latest bugs feed', () => {
      const value = 'http://feeds.launchpad.net/example/latest-bugs.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:project-bugs',
        label: 'Project latest bugs',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the person bugs key for a person latest bugs feed', () => {
      const value = 'http://feeds.launchpad.net/~example/latest-bugs.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:person-bugs',
        label: 'Person latest bugs',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the bugs key for a source package latest bugs feed', () => {
      const value = 'http://feeds.launchpad.net/example/+source/package/latest-bugs.atom'
      const expected: DiscoverUriHint = { key: 'launchpad:bugs', label: 'Latest bugs' }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the bug key for a bug feed', () => {
      const value = 'http://feeds.launchpad.net/bugs/123/bug.atom'
      const expected: DiscoverUriHint = { key: 'launchpad:bug', label: 'Bug' }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch key for a Bazaar branch feed', () => {
      const value = 'http://feeds.launchpad.net/~example/project/trunk/branch.atom'
      const expected: DiscoverUriHint = { key: 'launchpad:branch', label: 'Branch' }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the branch key for a source package branch feed', () => {
      const value = 'http://feeds.launchpad.net/~example/distro/series/package/branch/branch.atom'
      const expected: DiscoverUriHint = { key: 'launchpad:branch', label: 'Branch' }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project branches key for a project branches feed', () => {
      const value = 'http://feeds.launchpad.net/example/branches.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:project-branches',
        label: 'Project branches',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the person branches key for a person branches feed', () => {
      const value = 'http://feeds.launchpad.net/~example/branches.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:person-branches',
        label: 'Person branches',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the project revisions key for a project revisions feed', () => {
      const value = 'http://feeds.launchpad.net/example/revisions.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:project-revisions',
        label: 'Project revisions',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the person revisions key for a person revisions feed', () => {
      const value = 'http://feeds.launchpad.net/~example/revisions.atom'
      const expected: DiscoverUriHint = {
        key: 'launchpad:person-revisions',
        label: 'Person revisions',
      }

      expect(launchpadHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a project page', () => {
      const value = 'https://launchpad.net/example'

      expect(launchpadHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a branch feed path without the owner tilde', () => {
      const value = 'http://feeds.launchpad.net/example/project/trunk/branch.atom'

      expect(launchpadHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'http://example.com/example/announcements.atom'

      expect(launchpadHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'http://feeds.launchpad.net/announcements.atom',
        { key: 'launchpad:announcements', label: 'Announcements' },
      ],
      [
        'https://feeds.launchpad.net/example/announcements.atom',
        { key: 'launchpad:project-announcements', label: 'Project announcements' },
      ],
      [
        'http://feeds.launchpad.net/bugs/latest-bugs.atom',
        { key: 'launchpad:bugs', label: 'Latest bugs' },
      ],
      [
        'https://feeds.launchpad.net/~example/latest-bugs.atom',
        { key: 'launchpad:person-bugs', label: 'Person latest bugs' },
      ],
      [
        'http://feeds.launchpad.net/example/+source/package/latest-bugs.atom',
        { key: 'launchpad:bugs', label: 'Latest bugs' },
      ],
      ['http://feeds.launchpad.net/bugs/123/bug.atom', { key: 'launchpad:bug', label: 'Bug' }],
      [
        'https://feeds.launchpad.net/~example/project/trunk/branch.atom',
        { key: 'launchpad:branch', label: 'Branch' },
      ],
      [
        'http://feeds.launchpad.net/~example/distro/series/package/branch/branch.atom',
        { key: 'launchpad:branch', label: 'Branch' },
      ],
      [
        'https://feeds.launchpad.net/example/branches.atom',
        { key: 'launchpad:project-branches', label: 'Project branches' },
      ],
      [
        'https://feeds.launchpad.net/example/latest-bugs.atom',
        { key: 'launchpad:project-bugs', label: 'Project latest bugs' },
      ],
      [
        'http://feeds.launchpad.net/~example/branches.atom',
        { key: 'launchpad:person-branches', label: 'Person branches' },
      ],
      [
        'https://feeds.launchpad.net/~example/revisions.atom',
        { key: 'launchpad:person-revisions', label: 'Person revisions' },
      ],
      [
        'http://feeds.launchpad.net/example/revisions.atom',
        { key: 'launchpad:project-revisions', label: 'Project revisions' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [launchpadHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
