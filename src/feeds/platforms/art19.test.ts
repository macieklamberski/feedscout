import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type Art19Url, art19Handler, parseArt19Url } from './art19.js'

describe('parseArt19Url', () => {
  it('should return the show for a show page', () => {
    const expected: Art19Url = { kind: 'show', slug: 'my-show' }

    expect(parseArt19Url('https://art19.com/shows/my-show')).toEqual(expected)
  })

  it('should return the show for a show page with a capitalized shows segment', () => {
    const expected: Art19Url = { kind: 'show', slug: 'my-show' }

    expect(parseArt19Url('https://www.art19.com/Shows/my-show')).toEqual(expected)
  })

  it('should return undefined for a show page under its uuid', () => {
    const value = 'https://art19.com/shows/58dacbdc-646e-4585-9914-19c3de11d1ba'

    expect(parseArt19Url(value)).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseArt19Url('https://art19.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseArt19Url('https://example.com/shows/my-show')).toBeUndefined()
  })
})

describe('art19Handler', () => {
  describe('match', () => {
    it('should match a show page', () => {
      expect(art19Handler.match('https://art19.com/shows/example-show')).toBe(true)
      expect(art19Handler.match('https://www.art19.com/shows/example-show')).toBe(true)
    })

    it('should match a show page with a capitalized shows segment', () => {
      expect(art19Handler.match('https://art19.com/Shows/example-show')).toBe(true)
      expect(art19Handler.match('https://www.art19.com/shows/example-show')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(art19Handler.match('https://art19.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(art19Handler.match('https://example.com/shows/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(art19Handler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(art19Handler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the show feed on the feed host', () => {
      const value = 'https://art19.com/shows/example-show'
      const expected = [
        { uri: 'https://rss.art19.com/example-show', hint: { key: 'art19:show', label: 'Show' } },
      ]

      expect(art19Handler.resolve(value)).toEqual(expected)
    })

    it('should use the slug from an episode page', () => {
      const value = 'https://art19.com/shows/example-show/episodes/abc123'
      const expected = [
        { uri: 'https://rss.art19.com/example-show', hint: { key: 'art19:show', label: 'Show' } },
      ]

      expect(art19Handler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(art19Handler.resolve('https://art19.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the show hint for a show feed under its slug', () => {
      const value = 'https://rss.art19.com/alice-show'
      const expected: DiscoverUriHint = { key: 'art19:show', label: 'Show' }

      expect(art19Handler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show hint for a private feed', () => {
      const value = 'https://rss.art19.com/alternate_feeds/user/example-show/abc123'
      const expected: DiscoverUriHint = { key: 'art19:show', label: 'Show' }

      expect(art19Handler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show hint for a show feed under its uuid', () => {
      const value = 'https://rss.art19.com/3399916b-c0b3-4c58-89e3-4572f197d6f1'
      const expected: DiscoverUriHint = { key: 'art19:show', label: 'Show' }

      expect(art19Handler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the show hint for a show feed with a capitalized slug', () => {
      const value = 'https://rss.art19.com/Bob-Health-Show'
      const expected: DiscoverUriHint = { key: 'art19:show', label: 'Show' }

      expect(art19Handler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the feed host root', () => {
      const value = 'https://rss.art19.com/'

      expect(art19Handler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a show page', () => {
      const value = 'https://art19.com/shows/alice-show'

      expect(art19Handler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/alice-show'

      expect(art19Handler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://rss.art19.com/alice-show', { key: 'art19:show', label: 'Show' }],
      [
        'https://rss.art19.com/3399916b-c0b3-4c58-89e3-4572f197d6f1',
        { key: 'art19:show', label: 'Show' },
      ],
      ['https://rss.art19.com/Bob-Health-Show', { key: 'art19:show', label: 'Show' }],
      [
        'https://rss.art19.com/alternate_feeds/user/example-show/abc123',
        { key: 'art19:show', label: 'Show' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [art19Handler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
