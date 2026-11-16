import { describe, expect, it } from 'bun:test'
import type { DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PodomaticUrl, parsePodomaticUrl, podomaticHandler } from './podomatic.js'

describe('parsePodomaticUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const expected: PodomaticUrl = { kind: 'podcast', show: 'example-show' }

    expect(parsePodomaticUrl('https://example-show.podomatic.com/')).toEqual(expected)
  })

  it('should return the podcast for a directory path', () => {
    const expected: PodomaticUrl = { kind: 'podcast', show: 'example-show' }

    expect(parsePodomaticUrl('https://www.podomatic.com/podcasts/example-show')).toEqual(expected)
  })

  it('should return undefined for the directory index', () => {
    expect(parsePodomaticUrl('https://www.podomatic.com/podcasts')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePodomaticUrl('https://www.example.podomatic.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePodomaticUrl('https://example.com/podcasts/example-show')).toBeUndefined()
  })
})

describe('podomaticHandler', () => {
  describe('match', () => {
    it('should match a show subdomain', () => {
      expect(podomaticHandler.match('https://example-show.podomatic.com/')).toBe(true)
    })

    it('should match a directory path', () => {
      expect(podomaticHandler.match('https://www.podomatic.com/podcasts/example-show')).toBe(true)
    })

    it('should match a directory path with a capitalized podcasts segment', () => {
      expect(podomaticHandler.match('https://www.podomatic.com/Podcasts/example-show')).toBe(true)
    })

    it('should not match the directory index', () => {
      expect(podomaticHandler.match('https://www.podomatic.com/podcasts')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(podomaticHandler.match('https://example.com/podcasts/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(podomaticHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return an empty array for a directory show that is not one host label', () => {
      const value = 'https://www.podomatic.com/podcasts/alice@example.org'

      expect(podomaticHandler.resolve(value)).toEqual([])
    })

    it('should return the show feed from a subdomain', () => {
      const value = 'https://example-show.podomatic.com/'
      const expected = [
        {
          uri: 'https://example-show.podomatic.com/rss2.xml',
          hint: { key: 'podomatic:show', label: 'Show' },
        },
      ]

      expect(podomaticHandler.resolve(value)).toEqual(expected)
    })

    it('should return the show feed under the page scheme for an http subdomain', () => {
      const value = 'http://example-show.podomatic.com/'
      const expected = [
        {
          uri: 'http://example-show.podomatic.com/rss2.xml',
          hint: { key: 'podomatic:show', label: 'Show' },
        },
      ]

      expect(podomaticHandler.resolve(value)).toEqual(expected)
    })

    it('should map a directory path back to the subdomain', () => {
      const value = 'https://www.podomatic.com/podcasts/example-show'
      const expected = [
        {
          uri: 'https://example-show.podomatic.com/rss2.xml',
          hint: { key: 'podomatic:show', label: 'Show' },
        },
      ]

      expect(podomaticHandler.resolve(value)).toEqual(expected)
    })

    it('should write a capitalized directory show in lowercase', () => {
      const value = 'https://www.podomatic.com/podcasts/Example-Show'
      const expected = [
        {
          uri: 'https://example-show.podomatic.com/rss2.xml',
          hint: { key: 'podomatic:show', label: 'Show' },
        },
      ]

      expect(podomaticHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the directory index', () => {
      expect(podomaticHandler.resolve('https://www.podomatic.com/podcasts')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the show hint for a show feed', () => {
      const value = 'https://example-show.podomatic.com/rss2.xml'
      const expected: DiscoverUriHint = { key: 'podomatic:show', label: 'Show' }

      expect(podomaticHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show hint for a show feed over http', () => {
      const value = 'http://example-show.podomatic.com/rss2.xml'
      const expected: DiscoverUriHint = { key: 'podomatic:show', label: 'Show' }

      expect(podomaticHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show hint for an archive feed', () => {
      const value = 'https://example-show.podomatic.com/archive/rss2.xml'
      const expected: DiscoverUriHint = { key: 'podomatic:show', label: 'Show' }

      expect(podomaticHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a show page', () => {
      const value = 'https://example-show.podomatic.com/'

      expect(podomaticHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the main host', () => {
      const value = 'https://www.podomatic.com/rss2.xml'

      expect(podomaticHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.example-show.podomatic.com/rss2.xml'

      expect(podomaticHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const values = [
      'https://example-show.podomatic.com/rss2.xml',
      'http://example-show.podomatic.com/rss2.xml',
      'https://example-show.podomatic.com/archive/rss2.xml',
    ]

    it.each(values)('should return %s as given with its key', async (value) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [podomaticHandler],
        baseUrl: value,
      }
      const expected = [{ uri: value, hint: { key: 'podomatic:show', label: 'Show' } }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
