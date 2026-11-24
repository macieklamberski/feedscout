import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type HeyWorldUrl, heyWorldHandler, parseHeyWorldUrl } from './heyWorld.js'

describe('parseHeyWorldUrl', () => {
  it('should return the blog for a user page', () => {
    const expected: HeyWorldUrl = { kind: 'blog', username: 'bob' }

    expect(parseHeyWorldUrl('https://world.hey.com/bob')).toEqual(expected)
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
      [true, 'https://world.hey.com/alice'],
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
      const value = 'https://world.hey.com/alice'
      const expected = [
        {
          uri: 'https://world.hey.com/alice/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(heyWorldHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://world.hey.com/alice/some-post-title'
      const expected = [
        {
          uri: 'https://world.hey.com/alice/feed.atom',
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

  describe('getFeedHint', () => {
    it('should return the blog hint for a blog feed', () => {
      const value = 'https://world.hey.com/alice/feed.atom'
      const expected: DiscoverUriHint = { key: 'hey-world:blog', label: 'Blog' }

      expect(heyWorldHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a blog feed as itself', async () => {
      const value = 'https://world.hey.com/alice/feed.atom'
      const options = {
        ...defaultPlatformOptions,
        handlers: [heyWorldHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://world.hey.com/alice/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
