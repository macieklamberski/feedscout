import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type AtwikiUrl, atwikiHandler, parseAtwikiUrl } from './atwiki.js'

describe('parseAtwikiUrl', () => {
  it('should return the wiki for a wiki page', () => {
    const expected: AtwikiUrl = { kind: 'wiki', wiki: 'mywiki' }

    expect(parseAtwikiUrl('https://w.atwiki.jp/mywiki/pages/1.html')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseAtwikiUrl('https://w.atwiki.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAtwikiUrl('https://example.com/mywiki')).toBeUndefined()
  })
})

describe('atwikiHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://w.atwiki.jp/example/'],
      [true, 'https://w.atwiki.jp/example/pages/1.html'],
      [true, 'https://w.atwiki.jp/example/?page=Menu'],
      [false, 'https://w.atwiki.jp/'],
      [false, 'https://atwiki.jp/news/29'],
      [false, 'https://example.com/example/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(atwikiHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(atwikiHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return wiki feeds for any page of the wiki', () => {
      const value = 'https://w.atwiki.jp/example/pages/1.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://w.atwiki.jp/example/rss10.xml',
          hint: { key: 'atwiki:updated-pages', label: 'Updated pages', format: 'rdf' },
        },
        {
          uri: 'https://w.atwiki.jp/example/feed.atom',
          hint: { key: 'atwiki:updated-pages', label: 'Updated pages', format: 'atom' },
        },
        {
          uri: 'https://w.atwiki.jp/example/rss10_new.xml',
          hint: { key: 'atwiki:new-pages', label: 'New pages', format: 'rdf' },
        },
      ]

      expect(atwikiHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-wiki path', () => {
      expect(atwikiHandler.resolve('https://w.atwiki.jp/')).toEqual([])
    })
  })
  describe('getFeedHint', () => {
    it('should return the updated pages key for an RDF feed', () => {
      const value = 'https://w.atwiki.jp/example/rss10.xml'
      const expected: DiscoverUriHint = {
        key: 'atwiki:updated-pages',
        label: 'Updated pages',
        format: 'rdf',
      }

      expect(atwikiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updated pages key for the rss spelling of the RDF feed', () => {
      const value = 'https://w.atwiki.jp/example/rss'
      const expected: DiscoverUriHint = {
        key: 'atwiki:updated-pages',
        label: 'Updated pages',
        format: 'rdf',
      }

      expect(atwikiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the updated pages key for an Atom feed', () => {
      const value = 'https://w.atwiki.jp/example/feed.atom'
      const expected: DiscoverUriHint = {
        key: 'atwiki:updated-pages',
        label: 'Updated pages',
        format: 'atom',
      }

      expect(atwikiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the new pages key for a new pages feed', () => {
      const value = 'https://w.atwiki.jp/example/rss10_new.xml'
      const expected: DiscoverUriHint = {
        key: 'atwiki:new-pages',
        label: 'New pages',
        format: 'rdf',
      }

      expect(atwikiHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a wiki page', () => {
      const value = 'https://w.atwiki.jp/example/pages/1.html'

      expect(atwikiHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a wiki root', () => {
      const value = 'https://w.atwiki.jp/example/'

      expect(atwikiHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/example/rss10.xml'

      expect(atwikiHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const values: Array<[string, DiscoverUriHint]> = [
      [
        'https://w.atwiki.jp/example/rss10.xml',
        { key: 'atwiki:updated-pages', label: 'Updated pages', format: 'rdf' },
      ],
      [
        'https://w.atwiki.jp/example/rss',
        { key: 'atwiki:updated-pages', label: 'Updated pages', format: 'rdf' },
      ],
      [
        'https://w.atwiki.jp/example/feed.atom',
        { key: 'atwiki:updated-pages', label: 'Updated pages', format: 'atom' },
      ],
      [
        'https://w.atwiki.jp/example/rss10_new.xml',
        { key: 'atwiki:new-pages', label: 'New pages', format: 'rdf' },
      ],
    ]

    it.each(values)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [atwikiHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
