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

  it('should return the curated page for a pages path', () => {
    const expected: KickstarterUrl = { kind: 'page', name: 'example' }

    expect(parseKickstarterUrl('https://www.kickstarter.com/pages/example')).toEqual(expected)
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
      const value = 'https://www.kickstarter.com/projects/alicesplace/alices-place'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.kickstarter.com/projects/alicesplace/alices-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for project page with a capitalized projects segment', () => {
      const value = 'https://www.kickstarter.com/Projects/alicesplace/alices-place'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.kickstarter.com/projects/alicesplace/alices-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should return atom feed for project subpage', () => {
      const value = 'https://www.kickstarter.com/projects/alicesplace/alices-place/description'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.kickstarter.com/projects/alicesplace/alices-place/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
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

    it('should return curated page feed for a curated page', () => {
      const value = 'https://www.kickstarter.com/pages/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.kickstarter.com/pages/example.atom',
          hint: { key: 'kickstarter:page', label: 'Curated projects' },
        },
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URLs with query params', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project?ref=discovery'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.kickstarter.com/projects/creator/project/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })

    it('should handle URLs with trailing slashes', () => {
      const value = 'https://www.kickstarter.com/projects/creator/project/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.kickstarter.com/projects/creator/project/posts.atom',
          hint: { key: 'kickstarter:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.kickstarter.com/projects/feed.atom',
          hint: { key: 'kickstarter:projects', label: 'Projects' },
        },
      ]

      expect(kickstarterHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the updates hint for a project updates feed without www', () => {
      const value = 'https://kickstarter.com/projects/alice/example/posts.atom'
      const expected: DiscoverUriHint = { key: 'kickstarter:updates', label: 'Updates' }

      expect(kickstarterHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  it('should return a project updates feed without www itself', async () => {
    const value = 'https://kickstarter.com/projects/alice/example/posts.atom'
    const hint: DiscoverUriHint = { key: 'kickstarter:updates', label: 'Updates' }
    const options = {
      ...defaultPlatformOptions,
      handlers: [kickstarterHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
