import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type KickstarterUrl, kickstarterHandler, parseKickstarterUrl } from './kickstarter.js'

describe('parseKickstarterUrl', () => {
  it('should return the project for a project page', () => {
    const expected: KickstarterUrl = { kind: 'project', creator: 'creator', project: 'project' }

    expect(parseKickstarterUrl('https://www.kickstarter.com/projects/creator/project')).toEqual(
      expected,
    )
  })

  it('should return the home page for any other page', () => {
    const expected: KickstarterUrl = { kind: 'home' }

    expect(parseKickstarterUrl('https://www.kickstarter.com/discover')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseKickstarterUrl('https://example.com/')).toBeUndefined()
  })
})

describe('kickstarterHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.kickstarter.com/projects/creator/project'],
      [true, 'https://kickstarter.com/projects/creator/project'],
      [true, 'https://kickstarter.com/discover'],
      [true, 'https://kickstarter.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(kickstarterHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(kickstarterHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Kickstarter', () => {
      expect(kickstarterHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return atom feed for project page', () => {
      const value = 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for project page with a capitalized projects segment', () => {
      const value = 'https://www.kickstarter.com/Projects/reinnesplace/reinnes-place'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for project subpage', () => {
      const value = 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/description'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/reinnesplace/reinnes-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return global projects feed for homepage', () => {
      const value = 'https://www.kickstarter.com/'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return global projects feed for discover page', () => {
      const value = 'https://www.kickstarter.com/discover'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return global projects feed for other non-project paths', () => {
      const value = 'https://www.kickstarter.com/help'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URLs with query params', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project?ref=discovery'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/creator/project/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URLs with trailing slashes', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project/'
      const expected = [
        {
          uri: 'https://www.kickstarter.com/projects/creator/project/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the updates hint for a project updates feed', () => {
      const value = 'https://www.kickstarter.com/projects/alice/example/posts.atom'
      const expected: DiscoverUriHint = { key: 'kickstarter:updates', label: 'Updates' }

      expect(kickstarterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updates hint for a project updates feed with a numeric creator', () => {
      const value = 'https://www.kickstarter.com/projects/12345/example/posts.atom'
      const expected: DiscoverUriHint = { key: 'kickstarter:updates', label: 'Updates' }

      expect(kickstarterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updates hint for a project updates feed without www', () => {
      const value = 'https://kickstarter.com/projects/alice/example/posts.atom'
      const expected: DiscoverUriHint = { key: 'kickstarter:updates', label: 'Updates' }

      expect(kickstarterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updates hint for a project updates feed over http', () => {
      const value = 'http://www.kickstarter.com/projects/alice/example/posts.atom'
      const expected: DiscoverUriHint = { key: 'kickstarter:updates', label: 'Updates' }

      expect(kickstarterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the projects hint for the projects feed', () => {
      const value = 'https://www.kickstarter.com/projects/feed.atom'
      const expected: DiscoverUriHint = { key: 'kickstarter:projects', label: 'Projects' }

      expect(kickstarterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the projects hint for the projects feed without www', () => {
      const value = 'https://kickstarter.com/projects/feed.atom'
      const expected: DiscoverUriHint = { key: 'kickstarter:projects', label: 'Projects' }

      expect(kickstarterHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a project page', () => {
      const value = 'https://www.kickstarter.com/projects/alice/example'

      expect(kickstarterHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the updates feed path on another host', () => {
      const value = 'https://example.com/projects/alice/example/posts.atom'

      expect(kickstarterHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const updatesHint: DiscoverUriHint = { key: 'kickstarter:updates', label: 'Updates' }
  const projectsHint: DiscoverUriHint = { key: 'kickstarter:projects', label: 'Projects' }
  const values: Array<[string, DiscoverUriHint]> = [
    ['https://www.kickstarter.com/projects/alice/example/posts.atom', updatesHint],
    ['https://kickstarter.com/projects/alice/example/posts.atom', updatesHint],
    ['http://www.kickstarter.com/projects/alice/example/posts.atom', updatesHint],
    ['https://www.kickstarter.com/projects/feed.atom', projectsHint],
    ['https://kickstarter.com/projects/feed.atom', projectsHint],
    ['http://www.kickstarter.com/projects/feed.atom', projectsHint],
  ]

  it.each(values)('should return %s itself', async (value, hint) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [kickstarterHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
