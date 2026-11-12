import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getHuffdufferPage,
  type HuffdufferPage,
  type HuffdufferUrl,
  huffdufferHandler,
  parseHuffdufferUrl,
} from './huffduffer.js'

describe('parseHuffdufferUrl', () => {
  it('should return the profile for a user page', () => {
    const expected: HuffdufferUrl = { kind: 'profile', username: 'alice' }

    expect(parseHuffdufferUrl('https://huffduffer.com/alice')).toEqual(expected)
  })

  it('should return the profile on the www host', () => {
    const expected: HuffdufferUrl = { kind: 'profile', username: 'alice' }

    expect(parseHuffdufferUrl('https://www.huffduffer.com/alice')).toEqual(expected)
  })

  it('should return the profile for the user feed', () => {
    const expected: HuffdufferUrl = { kind: 'profile', username: 'alice' }

    expect(parseHuffdufferUrl('https://huffduffer.com/alice/rss')).toEqual(expected)
  })

  it('should return the huffduff for an episode page', () => {
    const expected: HuffdufferUrl = { kind: 'huffduff', username: 'alice', id: '12345' }

    expect(parseHuffdufferUrl('https://huffduffer.com/alice/12345')).toEqual(expected)
  })

  it('should return the related for a related page', () => {
    const expected: HuffdufferUrl = { kind: 'related', username: 'alice', id: '12345' }

    expect(parseHuffdufferUrl('https://huffduffer.com/alice/12345/related')).toEqual(expected)
  })

  it('should return the profile for a section other than an episode id', () => {
    const expected: HuffdufferUrl = { kind: 'profile', username: 'alice' }

    expect(parseHuffdufferUrl('https://huffduffer.com/alice/12345abc')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: HuffdufferUrl = { kind: 'home' }

    expect(parseHuffdufferUrl('https://huffduffer.com/')).toEqual(expected)
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseHuffdufferUrl('https://www.alice.huffduffer.com/alice')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHuffdufferUrl('https://example.com/alice')).toBeUndefined()
  })
})

describe('getHuffdufferPage', () => {
  it('should return the username as the feed link spells it', () => {
    const value = 'https://huffduffer.com/alice/123456'
    const content = '<a href="https://huffduffer.com/Alice/rss">RSS</a>'
    const expected: HuffdufferPage = { kind: 'huffduff', username: 'Alice', id: '123456' }

    expect(getHuffdufferPage(value, content)).toEqual(expected)
  })

  it('should return the username from the url without content', () => {
    const expected: HuffdufferPage = { kind: 'profile', username: 'alice' }

    expect(getHuffdufferPage('https://huffduffer.com/alice', undefined)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(getHuffdufferPage('https://example.com/alice', undefined)).toBeUndefined()
  })

  it('should ignore the feed link of another account', () => {
    const value = 'https://huffduffer.com/alice'
    const content = '<a href="https://huffduffer.com/Bob/rss">Bob</a>'
    const expected: HuffdufferPage = { kind: 'profile', username: 'alice' }

    expect(getHuffdufferPage(value, content)).toEqual(expected)
  })

  it('should ignore the feed link of an account whose username starts with the page username', () => {
    const value = 'https://huffduffer.com/alice'
    const content = '<a href="https://huffduffer.com/AliceBooks/rss">Alice Books</a>'
    const expected: HuffdufferPage = { kind: 'profile', username: 'alice' }

    expect(getHuffdufferPage(value, content)).toEqual(expected)
  })
})

describe('huffdufferHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://huffduffer.com/alice'],
      [false, 'https://example.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(huffdufferHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Huffduffer', () => {
      expect(huffdufferHandler.resolve('https://example.com/alice')).toEqual([])
    })

    it('should return the site-wide new feeds for the home page', () => {
      const value = 'https://huffduffer.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://huffduffer.com/new/rss',
          hint: { key: 'huffduffer:new', label: 'New huffduffs', format: 'rss' },
        },
        {
          uri: 'https://huffduffer.com/new/atom',
          hint: { key: 'huffduffer:new', label: 'New huffduffs', format: 'atom' },
        },
        {
          uri: 'https://huffduffer.com/new/json',
          hint: { key: 'huffduffer:new', label: 'New huffduffs', format: 'json' },
        },
      ]

      expect(huffdufferHandler.resolve(value)).toEqual(expected)
    })

    it('should return the huffduffs feed for a profile', () => {
      const value = 'https://huffduffer.com/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://huffduffer.com/alice/rss',
          hint: { key: 'huffduffer:huffduffs', label: 'Huffduffs' },
        },
      ]

      expect(huffdufferHandler.resolve(value)).toEqual(expected)
    })

    it('should return the related and huffduffs feeds for an episode', () => {
      const value = 'https://huffduffer.com/alice/12345'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://huffduffer.com/alice/12345/related/rss',
          hint: { key: 'huffduffer:related', label: 'Possibly related' },
        },
        {
          uri: 'https://huffduffer.com/alice/rss',
          hint: { key: 'huffduffer:huffduffs', label: 'Huffduffs' },
        },
      ]

      expect(huffdufferHandler.resolve(value)).toEqual(expected)
    })

    it('should return the related feed for a related page', () => {
      const value = 'https://huffduffer.com/alice/12345/related'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://huffduffer.com/alice/12345/related/rss',
          hint: { key: 'huffduffer:related', label: 'Possibly related' },
        },
      ]

      expect(huffdufferHandler.resolve(value)).toEqual(expected)
    })

    it('should return the huffduffs feed on the apex host over https for a www page over http', () => {
      const value = 'http://www.huffduffer.com/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://huffduffer.com/alice/rss',
          hint: { key: 'huffduffer:huffduffs', label: 'Huffduffs' },
        },
      ]

      expect(huffdufferHandler.resolve(value)).toEqual(expected)
    })

    it('should spell the username as the profile page links it', () => {
      const value = 'https://huffduffer.com/alicesmith'
      const content = `
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS"
          href="https://huffduffer.com/AliceSmith/rss"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://huffduffer.com/AliceSmith/rss',
          hint: { key: 'huffduffer:huffduffs', label: 'Huffduffs' },
        },
      ]

      expect(huffdufferHandler.resolve(value, content)).toEqual(expected)
    })

    it('should spell the username as the episode page links it', () => {
      const value = 'https://huffduffer.com/AliceSmith/12345'
      const content = `
        <link
          rel="alternate"
          type="application/xml+rdf"
          title="RDF"
          href="https://huffduffer.com/alicesmith/12345/rdf"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://huffduffer.com/alicesmith/12345/related/rss',
          hint: { key: 'huffduffer:related', label: 'Possibly related' },
        },
        {
          uri: 'https://huffduffer.com/alicesmith/rss',
          hint: { key: 'huffduffer:huffduffs', label: 'Huffduffs' },
        },
      ]

      expect(huffdufferHandler.resolve(value, content)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the huffduffs key for a user feed', () => {
      const value = 'https://huffduffer.com/joeross/rss'
      const expected = 'huffduffer:huffduffs'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the huffduffs key for a user feed with a capitalized username', () => {
      const value = 'https://huffduffer.com/BlueTyson/rss'
      const expected = 'huffduffer:huffduffs'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the huffduffs key for a user feed on the www host over http', () => {
      const value = 'http://www.huffduffer.com/joeross/rss'
      const expected = 'huffduffer:huffduffs'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the huffduffs key for a user atom feed', () => {
      const value = 'https://huffduffer.com/plindberg/atom'
      const expected = 'huffduffer:huffduffs'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the huffduffs key for a user json feed', () => {
      const value = 'https://huffduffer.com/psd/json'
      const expected = 'huffduffer:huffduffs'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the related key for a related feed', () => {
      const value = 'https://huffduffer.com/adactio/12345/related/rss'
      const expected = 'huffduffer:related'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the new key for the new rss feed', () => {
      const value = 'https://huffduffer.com/new/rss'
      const expected = 'huffduffer:new'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the new key for the new atom feed', () => {
      const value = 'https://huffduffer.com/new/atom'
      const expected = 'huffduffer:new'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the new key for the new json feed', () => {
      const value = 'https://huffduffer.com/new/json'
      const expected = 'huffduffer:new'

      expect(huffdufferHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for the search feed', () => {
      const value = 'https://huffduffer.com/search/rss?q=Edward+Dutton'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the popular feed', () => {
      const value = 'https://huffduffer.com/popular/rss'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the search atom feed', () => {
      const value = 'https://huffduffer.com/search/atom?q=Edward+Dutton'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the search json feed', () => {
      const value = 'https://huffduffer.com/search/json?q=Edward+Dutton'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the popular atom feed', () => {
      const value = 'https://huffduffer.com/popular/atom'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the popular json feed', () => {
      const value = 'https://huffduffer.com/popular/json'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a collective feed', () => {
      const value = 'https://huffduffer.com/adactio/collective/rss'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://huffduffer.com/adactio'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an episode page', () => {
      const value = 'https://huffduffer.com/adactio/12345'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/joeross/rss'

      expect(huffdufferHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://huffduffer.com/joeross/rss', { key: 'huffduffer:huffduffs', label: 'Huffduffs' }],
      [
        'https://huffduffer.com/plindberg/atom',
        { key: 'huffduffer:huffduffs', label: 'Huffduffs' },
      ],
      ['https://huffduffer.com/psd/json', { key: 'huffduffer:huffduffs', label: 'Huffduffs' }],
      [
        'https://huffduffer.com/adactio/12345/related/rss',
        { key: 'huffduffer:related', label: 'Possibly related' },
      ],
      ['https://huffduffer.com/new/rss', { key: 'huffduffer:new', label: 'New huffduffs' }],
      ['https://huffduffer.com/new/atom', { key: 'huffduffer:new', label: 'New huffduffs' }],
      ['https://huffduffer.com/new/json', { key: 'huffduffer:new', label: 'New huffduffs' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [huffdufferHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
