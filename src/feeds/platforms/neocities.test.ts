import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type NeocitiesUrl, neocitiesHandler, parseNeocitiesUrl } from './neocities.js'

const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://neocities.org/site/alice.rss', { key: 'neocities:updates', label: 'Site updates' }],
  ['http://neocities.org/site/alice.rss', { key: 'neocities:updates', label: 'Site updates' }],
  ['https://www.neocities.org/site/alice.rss', { key: 'neocities:updates', label: 'Site updates' }],
]

describe('parseNeocitiesUrl', () => {
  it('should return the site for a subdomain', () => {
    const expected: NeocitiesUrl = { kind: 'site', username: 'example-site' }

    expect(parseNeocitiesUrl('https://example-site.neocities.org/')).toEqual(expected)
  })

  it('should return the site for a subdomain named static', () => {
    const expected: NeocitiesUrl = { kind: 'site', username: 'static' }

    expect(parseNeocitiesUrl('https://static.neocities.org/')).toEqual(expected)
  })

  it('should return the site for a profile path on the main host', () => {
    const expected: NeocitiesUrl = { kind: 'site', username: 'example-site' }

    expect(parseNeocitiesUrl('https://neocities.org/site/example-site')).toEqual(expected)
  })

  it('should return undefined for the main host without a site path', () => {
    expect(parseNeocitiesUrl('https://neocities.org/browse')).toBeUndefined()
  })

  it('should return undefined for the www host without a site path', () => {
    expect(parseNeocitiesUrl('https://www.neocities.org/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseNeocitiesUrl('https://blog.example-site.neocities.org/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseNeocitiesUrl('https://example.com/site/example-site')).toBeUndefined()
  })
})

describe('neocitiesHandler', () => {
  describe('match', () => {
    it('should match a site subdomain', () => {
      expect(neocitiesHandler.match('https://example-site.neocities.org/')).toBe(true)
    })

    it('should match a profile path on the main host', () => {
      expect(neocitiesHandler.match('https://neocities.org/site/example-site')).toBe(true)
    })

    it('should match a profile path on the main host with a capitalized site segment', () => {
      expect(neocitiesHandler.match('https://neocities.org/Site/example-site')).toBe(true)
    })

    it('should not match the main host without a site path', () => {
      expect(neocitiesHandler.match('https://neocities.org/')).toBe(false)
      expect(neocitiesHandler.match('https://neocities.org/browse')).toBe(false)
    })

    it('should not match a custom domain', () => {
      expect(neocitiesHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(neocitiesHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the updates feed for a site subdomain', () => {
      const value = 'https://example-site.neocities.org/'
      const expected = [
        {
          uri: 'https://neocities.org/site/example-site.rss',
          hint: { key: 'neocities:updates', label: 'Site updates' },
        },
      ]

      expect(neocitiesHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for a profile path', () => {
      const value = 'https://neocities.org/site/example-site'
      const expected = [
        {
          uri: 'https://neocities.org/site/example-site.rss',
          hint: { key: 'neocities:updates', label: 'Site updates' },
        },
      ]

      expect(neocitiesHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the main host root', () => {
      expect(neocitiesHandler.resolve('https://neocities.org/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the updates key for a site feed', () => {
      const value = 'https://neocities.org/site/alice.rss'
      const expected = 'neocities:updates'

      expect(neocitiesHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the updates key for a site feed on the www host', () => {
      const value = 'https://www.neocities.org/site/alice.rss'
      const expected = 'neocities:updates'

      expect(neocitiesHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the updates key for a site feed over http', () => {
      const value = 'http://neocities.org/site/alice.rss'
      const expected = 'neocities:updates'

      expect(neocitiesHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://neocities.org/site/alice'

      expect(neocitiesHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed file on a site subdomain', () => {
      const value = 'https://alice.neocities.org/site/alice.rss'

      expect(neocitiesHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/site/alice.rss'

      expect(neocitiesHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [neocitiesHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
