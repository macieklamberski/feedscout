import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type HeyWorldUrl, heyWorldHandler, parseHeyWorldUrl } from './heyWorld.js'

describe('parseHeyWorldUrl', () => {
  it('should return the blog for a user page', () => {
    const expected: HeyWorldUrl = { kind: 'blog', username: 'jason' }

    expect(parseHeyWorldUrl('https://world.hey.com/jason')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseHeyWorldUrl('https://world.hey.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHeyWorldUrl('https://example.com/')).toBeUndefined()
  })
})

describe('heyWorldHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://world.hey.com/dhh'],
      [false, 'https://world.hey.com'],
      [false, 'https://hey.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(heyWorldHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(heyWorldHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside HEY World', () => {
      expect(heyWorldHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://world.hey.com/dhh'
      const expected = [
        {
          uri: 'https://world.hey.com/dhh/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(heyWorldHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://world.hey.com/dhh/some-post-title'
      const expected = [
        {
          uri: 'https://world.hey.com/dhh/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(heyWorldHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://world.hey.com/'

      expect(heyWorldHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    const feedKeys: Array<[string, string]> = [
      ['https://world.hey.com/alice/feed.atom', 'hey-world:blog'],
      ['http://world.hey.com/alice/feed.atom', 'hey-world:blog'],
      ['https://world.hey.com/alice/feed.atom/', 'hey-world:blog'],
    ]

    it.each(feedKeys)('should return the key of %s', (value, expected) => {
      expect(heyWorldHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://world.hey.com/alice'

      expect(heyWorldHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a post page', () => {
      const value = 'https://world.hey.com/alice/hello-world-1a2b3c4d'

      expect(heyWorldHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/alice/feed.atom'

      expect(heyWorldHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<string> = [
      'https://world.hey.com/alice/feed.atom',
      'http://world.hey.com/alice/feed.atom',
      'https://world.hey.com/alice/feed.atom/',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [heyWorldHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'hey-world:blog', label: 'Blog' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
