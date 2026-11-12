import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getTransistorPage,
  parseTransistorUrl,
  type TransistorPage,
  type TransistorUrl,
  transistorHandler,
} from './transistor.js'

describe('parseTransistorUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: TransistorUrl = { kind: 'show', slug: 'example' }

    expect(parseTransistorUrl('https://example.transistor.fm/')).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseTransistorUrl('https://www.transistor.fm/')).toBeUndefined()
  })

  it('should return undefined for the feed host', () => {
    expect(parseTransistorUrl('https://feeds.transistor.fm/myshow')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseTransistorUrl('https://www.example.transistor.fm/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTransistorUrl('https://example.com/')).toBeUndefined()
  })
})

describe('getTransistorPage', () => {
  it('should return the feed slug the show page links', () => {
    const value = 'https://my-show.transistor.fm/'
    const content = '<a href="https://feeds.transistor.fm/my-show-podcast">RSS</a>'
    const expected: TransistorPage = { kind: 'show', slug: 'my-show-podcast' }

    expect(getTransistorPage(value, content)).toEqual(expected)
  })

  it('should return the subdomain without content', () => {
    const expected: TransistorPage = { kind: 'show', slug: 'my-show' }

    expect(getTransistorPage('https://my-show.transistor.fm/', undefined)).toEqual(expected)
  })

  it('should return undefined for the feed host', () => {
    expect(getTransistorPage('https://feeds.transistor.fm/my-show', undefined)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(getTransistorPage('https://example.com/', undefined)).toBeUndefined()
  })
})

describe('transistorHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.transistor.fm'],
      [false, 'https://blog.example.transistor.fm'],
      [false, 'https://transistor.fm'],
      [false, 'https://example.com'],
      [false, 'https://www.transistor.fm'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(transistorHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(transistorHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Transistor', () => {
      expect(transistorHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast', () => {
      const value = 'https://alice-podcast.transistor.fm'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice-podcast',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed slug the show page links when it differs from the subdomain', () => {
      const value = 'https://alice.transistor.fm'
      const content = '<link rel="alternate" href="https://feeds.transistor.fm/alice-podcast">'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice-podcast',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return a linked feed slug with a dot in it', () => {
      const value = 'https://alice.transistor.fm'
      const content = '<link rel="alternate" href="https://feeds.transistor.fm/alice.show">'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice.show',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value, content)).toEqual(expected)
    })

    it('should fall back to the subdomain when the page links no feed', () => {
      const value = 'https://alice.transistor.fm'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value, '<html></html>')).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice-podcast.transistor.fm/episodes/some-episode'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice-podcast',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(transistorHandler.resolve('https://transistor.fm/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the podcast key for a podcast feed', () => {
      const value = 'https://feeds.transistor.fm/wearechildfree'
      const expected = 'transistor:podcast'

      expect(transistorHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a podcast feed with a dot in its slug', () => {
      const value = 'https://feeds.transistor.fm/alice.show'
      const expected = 'transistor:podcast'

      expect(transistorHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a show page', () => {
      const value = 'https://wearechildfree.transistor.fm/'

      expect(transistorHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the feed host root', () => {
      const value = 'https://feeds.transistor.fm/'

      expect(transistorHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a nested path on the feed host', () => {
      const value = 'https://feeds.transistor.fm/wearechildfree/episodes'

      expect(transistorHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/wearechildfree'

      expect(transistorHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://feeds.transistor.fm/wearechildfree',
        { key: 'transistor:podcast', label: 'Podcast' },
      ],
      ['https://feeds.transistor.fm/westendgeeks', { key: 'transistor:podcast', label: 'Podcast' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [transistorHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
