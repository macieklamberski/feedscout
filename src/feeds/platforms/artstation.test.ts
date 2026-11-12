import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ArtstationUrl, artstationHandler, parseArtstationUrl } from './artstation.js'

describe('parseArtstationUrl', () => {
  it('should return the profile for a subdomain', () => {
    const expected: ArtstationUrl = { kind: 'profile', username: 'artist' }

    expect(parseArtstationUrl('https://artist.artstation.com/')).toEqual(expected)
  })

  it('should return the profile for a profile path', () => {
    const expected: ArtstationUrl = { kind: 'profile', username: 'artist' }

    expect(parseArtstationUrl('https://www.artstation.com/artist')).toEqual(expected)
  })

  it('should return the artwork page for the root', () => {
    const expected: ArtstationUrl = { kind: 'artwork' }

    expect(parseArtstationUrl('https://www.artstation.com/')).toEqual(expected)
  })

  it('should return the artwork page for the artwork path', () => {
    const expected: ArtstationUrl = { kind: 'artwork' }

    expect(parseArtstationUrl('https://www.artstation.com/artwork')).toEqual(expected)
  })

  it('should return undefined for a single artwork', () => {
    expect(parseArtstationUrl('https://www.artstation.com/artwork/XnYlQm')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseArtstationUrl('https://www.artstation.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseArtstationUrl('https://example.com/artist')).toBeUndefined()
  })
})

describe('artstationHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.artstation.com/alice'],
      [true, 'https://artstation.com/user'],
      [true, 'https://artstation.com'],
      [true, 'https://alice.artstation.com'],
      [false, 'https://a.b.artstation.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(artstationHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(artstationHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(artstationHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for portfolio', () => {
      const value = 'https://www.artstation.com/alice'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://www.artstation.com/alice/albums/all'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for subdomain form', () => {
      const value = 'https://alice.artstation.com'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for subdomain form regardless of subpath', () => {
      const value = 'https://alice.artstation.com/albums/all'
      const expected = [
        {
          uri: 'https://www.artstation.com/alice.rss',
          hint: { key: 'artstation:portfolio', label: 'Portfolio' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return global artwork feeds for root path', () => {
      const value = 'https://www.artstation.com/'
      const expected = [
        {
          uri: 'https://www.artstation.com/artwork.rss',
          hint: { key: 'artstation:artwork', label: 'Artwork' },
        },
        {
          uri: 'https://www.artstation.com/artwork.rss?sorting=latest',
          hint: { key: 'artstation:artwork-latest', label: 'Artwork (Latest)' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return global artwork feeds for /artwork page', () => {
      const value = 'https://www.artstation.com/artwork'
      const expected = [
        {
          uri: 'https://www.artstation.com/artwork.rss',
          hint: { key: 'artstation:artwork', label: 'Artwork' },
        },
        {
          uri: 'https://www.artstation.com/artwork.rss?sorting=latest',
          hint: { key: 'artstation:artwork-latest', label: 'Artwork (Latest)' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })

    it('should return global artwork feeds for /artwork page with a capitalized artwork segment', () => {
      const value = 'https://www.artstation.com/Artwork'
      const expected = [
        {
          uri: 'https://www.artstation.com/artwork.rss',
          hint: { key: 'artstation:artwork', label: 'Artwork' },
        },
        {
          uri: 'https://www.artstation.com/artwork.rss?sorting=latest',
          hint: { key: 'artstation:artwork-latest', label: 'Artwork (Latest)' },
        },
      ]

      expect(artstationHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the portfolio hint for a portfolio feed', () => {
      const value = 'https://www.artstation.com/aj3dvfx.rss'
      const expected: DiscoverUriHint = { key: 'artstation:portfolio', label: 'Portfolio' }

      expect(artstationHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the portfolio hint for a portfolio feed without www', () => {
      const value = 'https://artstation.com/alexpernau.rss'
      const expected: DiscoverUriHint = { key: 'artstation:portfolio', label: 'Portfolio' }

      expect(artstationHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the portfolio hint for a portfolio feed over http', () => {
      const value = 'http://www.artstation.com/alexpernau.rss'
      const expected: DiscoverUriHint = { key: 'artstation:portfolio', label: 'Portfolio' }

      expect(artstationHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the artwork hint for the artwork feed', () => {
      const value = 'https://www.artstation.com/artwork.rss'
      const expected: DiscoverUriHint = { key: 'artstation:artwork', label: 'Artwork' }

      expect(artstationHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the artwork hint for the artwork feed with a capitalized route', () => {
      const value = 'https://www.artstation.com/Artwork.rss'
      const expected: DiscoverUriHint = { key: 'artstation:artwork', label: 'Artwork' }

      expect(artstationHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the latest hint for the artwork feed sorted by latest', () => {
      const value = 'https://www.artstation.com/artwork.rss?sorting=latest'
      const expected: DiscoverUriHint = {
        key: 'artstation:artwork-latest',
        label: 'Artwork (Latest)',
      }

      expect(artstationHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a portfolio page', () => {
      const value = 'https://www.artstation.com/aj3dvfx'

      expect(artstationHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the artwork page', () => {
      const value = 'https://www.artstation.com/artwork'

      expect(artstationHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a portfolio subdomain', () => {
      const value = 'https://aj3dvfx.artstation.com/aj3dvfx.rss'

      expect(artstationHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed in a nested path', () => {
      const value = 'https://www.artstation.com/aj3dvfx/albums.rss'

      expect(artstationHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/aj3dvfx.rss'

      expect(artstationHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://www.artstation.com/aj3dvfx.rss',
        { key: 'artstation:portfolio', label: 'Portfolio' },
      ],
      ['https://www.artstation.com/artwork.rss', { key: 'artstation:artwork', label: 'Artwork' }],
      [
        'https://www.artstation.com/artwork.rss?sorting=latest',
        { key: 'artstation:artwork-latest', label: 'Artwork (Latest)' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [artstationHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
