import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PodbeanUrl, parsePodbeanUrl, podbeanHandler } from './podbean.js'

describe('parsePodbeanUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const expected: PodbeanUrl = { kind: 'podcast', show: 'example' }

    expect(parsePodbeanUrl('https://example.podbean.com/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parsePodbeanUrl('https://www.podbean.com/')).toBeUndefined()
  })

  it('should return undefined for the feed host', () => {
    expect(parsePodbeanUrl('https://feed.podbean.com/myshow/feed.xml')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePodbeanUrl('https://www.example.podbean.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePodbeanUrl('https://example.com/')).toBeUndefined()
  })
})

describe('podbeanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.podbean.com'],
      [false, 'https://blog.example.podbean.com'],
      [false, 'https://podbean.com'],
      [false, 'https://example.com'],
      [false, 'https://www.podbean.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(podbeanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(podbeanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://alice.podbean.com'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
        {
          uri: 'https://feed.podbean.com/alice/last1/feed.xml',
          hint: { key: 'podbean:latest', label: 'Latest episode' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.podbean.com/e/some-episode'
      const expected = [
        {
          uri: 'https://feed.podbean.com/alice/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
        {
          uri: 'https://feed.podbean.com/alice/last1/feed.xml',
          hint: { key: 'podbean:latest', label: 'Latest episode' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(podbeanHandler.resolve('https://podbean.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a podcast feed on the S3 bucket', () => {
      const value = 'https://s3.amazonaws.com/feed.podbean.com/erinnotes/feed.xml'
      const expected: DiscoverUriHint = { key: 'podbean:podcast', label: 'Podcast' }

      expect(podbeanHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a podcast feed on the show subdomain as itself', async () => {
      const value = 'https://dave1show.podbean.com/feed.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [podbeanHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://dave1show.podbean.com/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
