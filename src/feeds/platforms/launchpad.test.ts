import { describe, expect, it } from 'bun:test'
import { launchpadHandler } from './launchpad.js'

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

    it('should not match a reserved top-level route', () => {
      expect(launchpadHandler.match('https://launchpad.net/people')).toBe(false)
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
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/example/announcements.atom',
          hint: { key: 'launchpad:announcements', label: 'Announcements' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/latest-bugs.atom',
          hint: { key: 'launchpad:bugs', label: 'Latest bugs' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/branches.atom',
          hint: { key: 'launchpad:branches', label: 'Branches' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/revisions.atom',
          hint: { key: 'launchpad:revisions', label: 'Revisions' },
        },
      ]

      expect(launchpadHandler.resolve('https://launchpad.net/example')).toEqual(expected)
    })

    it('should return the latest bugs for a project on the bugs host', () => {
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/example/latest-bugs.atom',
          hint: { key: 'launchpad:bugs', label: 'Latest bugs' },
        },
      ]

      expect(launchpadHandler.resolve('https://bugs.launchpad.net/example')).toEqual(expected)
    })

    it('should return the code feeds for a project on the code host', () => {
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/example/branches.atom',
          hint: { key: 'launchpad:branches', label: 'Branches' },
        },
        {
          uri: 'http://feeds.launchpad.net/example/revisions.atom',
          hint: { key: 'launchpad:revisions', label: 'Revisions' },
        },
      ]

      expect(launchpadHandler.resolve('https://code.launchpad.net/example')).toEqual(expected)
    })

    it('should return the person feeds for a person page', () => {
      const expected = [
        {
          uri: 'http://feeds.launchpad.net/~example/latest-bugs.atom',
          hint: { key: 'launchpad:bugs', label: 'Latest bugs' },
        },
        {
          uri: 'http://feeds.launchpad.net/~example/branches.atom',
          hint: { key: 'launchpad:branches', label: 'Branches' },
        },
        {
          uri: 'http://feeds.launchpad.net/~example/revisions.atom',
          hint: { key: 'launchpad:revisions', label: 'Revisions' },
        },
      ]

      expect(launchpadHandler.resolve('https://launchpad.net/~example')).toEqual(expected)
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
  })
})
