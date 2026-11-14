import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type LibsynUrl, libsynHandler, parseLibsynUrl } from './libsyn.js'

describe('parseLibsynUrl', () => {
  it('should return the feed for a feeds host show', () => {
    const expected: LibsynUrl = { kind: 'feed', showId: '12345' }

    expect(parseLibsynUrl('https://feeds.libsyn.com/12345')).toEqual(expected)
  })

  it('should return undefined for a feeds host page without a numeric show', () => {
    expect(parseLibsynUrl('https://feeds.libsyn.com/about')).toBeUndefined()
  })

  it('should return the site for a sites host show', () => {
    const expected: LibsynUrl = { kind: 'site', showId: '12345' }

    expect(parseLibsynUrl('https://sites.libsyn.com/12345/example-episode')).toEqual(expected)
  })

  it('should return undefined for a sites host page without a numeric show', () => {
    expect(parseLibsynUrl('https://sites.libsyn.com/about')).toBeUndefined()
  })

  it('should return the podcast for a show subdomain', () => {
    const expected: LibsynUrl = { kind: 'podcast', slug: 'myshow' }

    expect(parseLibsynUrl('https://myshow.libsyn.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseLibsynUrl('https://example.com/')).toBeUndefined()
  })
})

describe('libsynHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.libsyn.com'],
      [false, 'https://blog.example.libsyn.com'],
      [false, 'https://libsyn.com'],
      [false, 'https://www.libsyn.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(libsynHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(libsynHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Libsyn', () => {
      expect(libsynHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast', () => {
      const value = 'https://alice.libsyn.com'
      const expected = [
        {
          uri: 'https://alice.libsyn.com/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.libsyn.com/website'
      const expected = [
        {
          uri: 'https://alice.libsyn.com/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve show ID for feeds.libsyn.com canonical URL', () => {
      const value = 'https://feeds.libsyn.com/113039/rss'
      const expected = [
        {
          uri: 'https://feeds.libsyn.com/113039/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should preserve show ID for feeds.libsyn.com without /rss suffix', () => {
      const value = 'https://feeds.libsyn.com/113039'
      const expected = [
        {
          uri: 'https://feeds.libsyn.com/113039/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for feeds.libsyn.com without numeric show ID', () => {
      const value = 'https://feeds.libsyn.com/something-non-numeric'

      expect(libsynHandler.resolve(value)).toEqual([])
    })

    it('should return the show feed for a sites host page', () => {
      const value = 'https://sites.libsyn.com/12345/example-episode'
      const expected = [
        {
          uri: 'https://feeds.libsyn.com/12345/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed under the page scheme for an http podcast page', () => {
      const value = 'http://alice.libsyn.com/website'
      const expected = [
        {
          uri: 'http://alice.libsyn.com/rss',
          hint: { key: 'libsyn:podcast', label: 'Podcast' },
        },
      ]

      expect(libsynHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast hint for a show feed', () => {
      const value = 'https://feeds.libsyn.com/12345/rss'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show feed over http', () => {
      const value = 'http://feeds.libsyn.com/12345/rss'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show destination feed', () => {
      const value = 'https://rss.libsyn.com/shows/12345/destinations/67890.xml'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed', () => {
      const value = 'https://alice.libsyn.com/rss'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed with a trailing slash', () => {
      const value = 'https://alice.libsyn.com/rss/'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a podcast page', () => {
      const value = 'https://alice.libsyn.com/website'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the podcast hint for a show feed without the feed path', () => {
      const value = 'https://feeds.libsyn.com/12345'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show feed cut to its last episodes', () => {
      const value = 'https://feeds.libsyn.com/12345/last100'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a podcast feed cut to its last episodes', () => {
      const value = 'https://alice.libsyn.com/rss/last150'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast hint for a show feed on the sites host', () => {
      const value = 'https://sites.libsyn.com/12345/rss/'
      const expected: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed', () => {
      const value = 'https://alice.libsyn.com/rss/category/Example+Category'
      const expected: DiscoverUriHint = { key: 'libsyn:category', label: 'Category' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed on the sites host', () => {
      const value = 'https://sites.libsyn.com/12345/rss/category/example_category'
      const expected: DiscoverUriHint = { key: 'libsyn:category', label: 'Category' }

      expect(libsynHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for another feed under a show', () => {
      const value = 'https://feeds.libsyn.com/12345/example'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the sites host without a numeric show', () => {
      const value = 'https://sites.libsyn.com/rss/category/example'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a file on the feeds host', () => {
      const value = 'https://feeds.libsyn.com/robots.txt'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the feeds host feed path', () => {
      const value = 'https://feeds.libsyn.com/rss'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a non-numeric show', () => {
      const value = 'https://feeds.libsyn.com/about/rss'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.alice.libsyn.com/rss'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/rss'

      expect(libsynHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'libsyn:podcast', label: 'Podcast' }
    const values = [
      'https://feeds.libsyn.com/12345/rss',
      'http://feeds.libsyn.com/12345/rss',
      'https://feeds.libsyn.com/12345/',
      'https://alice.libsyn.com/rss',
      'https://alice.libsyn.com/rss/',
      'http://alice.libsyn.com/rss',
      'https://rss.libsyn.com/shows/12345/destinations/67890.xml',
      'https://sites.libsyn.com/12345/rss',
      'https://feeds.libsyn.com/12345/last100',
      'http://alice.libsyn.com/rss/last150',
    ]

    it.each(values)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [libsynHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })

    const categoryHint: DiscoverUriHint = { key: 'libsyn:category', label: 'Category' }
    const categoryValues = [
      'https://alice.libsyn.com/rss/category/Example+Category/',
      'https://sites.libsyn.com/12345/rss/category/example_category',
    ]

    it.each(categoryValues)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [libsynHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint: categoryHint }]

      expect(result).toEqual(expected)
    })
  })
})
