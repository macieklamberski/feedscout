import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type PodcloudUrl, parsePodcloudUrl, podcloudHandler } from './podcloud.js'

describe('parsePodcloudUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: PodcloudUrl = { kind: 'show' }

    expect(parsePodcloudUrl('https://alice-podcast.lepodcast.fr/')).toEqual(expected)
  })

  it('should return the show for an episode page', () => {
    const expected: PodcloudUrl = { kind: 'show' }

    expect(parsePodcloudUrl('https://alice-podcast.lepodcast.fr/first-episode')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parsePodcloudUrl('https://lepodcast.fr/')).toBeUndefined()
  })

  it('should return undefined for an excluded subdomain', () => {
    expect(parsePodcloudUrl('https://studio.lepodcast.fr/dashboard')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePodcloudUrl('https://example.com/')).toBeUndefined()
  })
})

describe('podcloudHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.lepodcast.fr/first-episode'],
      [false, 'https://www.lepodcast.fr'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(podcloudHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(podcloudHandler.resolve('https://example.com/')).toEqual([])
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
})
