import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PodcloudUrl, parsePodcloudUrl, podcloudHandler } from './podcloud.js'

describe('parsePodcloudUrl', () => {
  it('should return the show for a show subdomain', () => {
    const value = 'https://alice-podcast.lepodcast.fr/'
    const expected: PodcloudUrl = {
      kind: 'show',
      show: 'alice-podcast',
    }

    expect(parsePodcloudUrl(value)).toEqual(expected)
  })

  it('should return the show for an episode page', () => {
    const value = 'https://alice-podcast.lepodcast.fr/first-episode'
    const expected: PodcloudUrl = {
      kind: 'show',
      show: 'alice-podcast',
    }

    expect(parsePodcloudUrl(value)).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    const value = 'https://lepodcast.fr/'

    expect(parsePodcloudUrl(value)).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    const value = 'https://www.example.lepodcast.fr/'

    expect(parsePodcloudUrl(value)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    const value = 'https://example.com/'

    expect(parsePodcloudUrl(value)).toBeUndefined()
  })
})

describe('podcloudHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.lepodcast.fr/first-episode'],
      [false, 'https://www.lepodcast.fr'],
    ]

    it.each(values)('should return %s for %s', (expected, value) => {
      expect(podcloudHandler.match(value)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      const value = 'https://example.com/'

      expect(podcloudHandler.resolve(value)).toEqual([])
    })

    it('should return the show feed for an episode page', () => {
      const value = 'https://alice-podcast.lepodcast.fr/first-episode'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice-podcast.lepodcast.fr/rss',
          hint: { key: 'podcloud:podcast', label: 'Podcast' },
        },
      ]

      expect(podcloudHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feed for an http page', () => {
      const value = 'http://alice-podcast.lepodcast.fr/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice-podcast.lepodcast.fr/rss',
          hint: { key: 'podcloud:podcast', label: 'Podcast' },
        },
      ]

      expect(podcloudHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the podcast key for a show feed', () => {
      const value = 'https://alice-podcast.lepodcast.fr/rss'
      const expected = 'podcloud:podcast'

      expect(podcloudHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a show feed over http', () => {
      const value = 'http://alice-podcast.lepodcast.fr/rss'
      const expected = 'podcloud:podcast'

      expect(podcloudHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for the /feed show feed', () => {
      const value = 'https://alice-podcast.lepodcast.fr/feed'
      const expected = 'podcloud:podcast'

      expect(podcloudHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for an episode page', () => {
      const value = 'https://alice-podcast.lepodcast.fr/first-episode'

      expect(podcloudHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the site feed on the apex domain', () => {
      const value = 'https://lepodcast.fr/rss.xml'

      expect(podcloudHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://feeds.example.lepodcast.fr/rss'

      expect(podcloudHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const values = [
      'https://alice-podcast.lepodcast.fr/rss',
      'http://alice-podcast.lepodcast.fr/rss',
      'https://alice-podcast.lepodcast.fr/rss/',
      'https://alice-podcast.lepodcast.fr/feed',
    ]

    it.each(values)('should return %s as given with its key', async (value) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [podcloudHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'podcloud:podcast', label: 'Podcast' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
