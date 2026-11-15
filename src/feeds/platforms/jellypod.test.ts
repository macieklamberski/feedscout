import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type JellypodUrl, jellypodHandler, parseJellypodUrl } from './jellypod.js'

describe('parseJellypodUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: JellypodUrl = { kind: 'show' }

    expect(parseJellypodUrl('https://alice-podcast.jellypod.com/')).toEqual(expected)
  })

  it('should return the show for an episode page', () => {
    const value = 'https://alice-podcast.jellypod.com/episodes/0b6f2c1e-4d3a-4f5b-9c8d-7e6f5a4b3c2d'
    const expected: JellypodUrl = { kind: 'show' }

    expect(parseJellypodUrl(value)).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseJellypodUrl('https://jellypod.com/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseJellypodUrl('https://www.jellypod.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseJellypodUrl('https://www.alice-podcast.jellypod.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseJellypodUrl('https://example.com/')).toBeUndefined()
  })
})

describe('jellypodHandler', () => {
  describe('match', () => {
    it('should return true for a show subdomain', () => {
      expect(jellypodHandler.match('https://alice-podcast.jellypod.com/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(jellypodHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(jellypodHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the podcast feed for a show', () => {
      const value =
        'https://alice-podcast.jellypod.com/episodes/0b6f2c1e-4d3a-4f5b-9c8d-7e6f5a4b3c2d'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice-podcast.jellypod.com/rss',
          hint: { key: 'jellypod:podcast', label: 'Podcast' },
        },
      ]

      expect(jellypodHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed under the page scheme for an http show page', () => {
      const value = 'http://alice-podcast.jellypod.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice-podcast.jellypod.com/rss',
          hint: { key: 'jellypod:podcast', label: 'Podcast' },
        },
      ]

      expect(jellypodHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a show feed', () => {
      const value = 'https://alice-podcast.jellypod.com/rss'
      const expected: DiscoverUriHint = { key: 'jellypod:podcast', label: 'Podcast' }

      expect(jellypodHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for an http show feed with a trailing slash', () => {
      const value = 'http://alice-podcast.jellypod.com/rss/'
      const expected: DiscoverUriHint = { key: 'jellypod:podcast', label: 'Podcast' }

      expect(jellypodHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a show page', () => {
      const value = 'https://alice-podcast.jellypod.com/'

      expect(jellypodHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an episode page', () => {
      const value =
        'https://alice-podcast.jellypod.com/episodes/0b6f2c1e-4d3a-4f5b-9c8d-7e6f5a4b3c2d'

      expect(jellypodHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under www on a show subdomain', () => {
      const value = 'https://www.alice-podcast.jellypod.com/rss'

      expect(jellypodHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.alice-podcast.jellypod.com/rss'

      expect(jellypodHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex', () => {
      const value = 'https://jellypod.com/rss'

      expect(jellypodHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss'

      expect(jellypodHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice-podcast.jellypod.com/rss', { key: 'jellypod:podcast', label: 'Podcast' }],
      ['https://alice-podcast.jellypod.com/rss/', { key: 'jellypod:podcast', label: 'Podcast' }],
      ['http://alice-podcast.jellypod.com/rss', { key: 'jellypod:podcast', label: 'Podcast' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [jellypodHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
