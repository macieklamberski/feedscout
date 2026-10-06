import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type HuffdufferUrl, huffdufferHandler, parseHuffdufferUrl } from './huffduffer.js'

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

  const sitePaths = [
    'https://huffduffer.com/',
    'https://huffduffer.com/new',
    'https://huffduffer.com/popular/rss',
    'https://huffduffer.com/search/rss?q=example',
    'https://huffduffer.com/Users',
    'https://huffduffer.com/about',
    'https://huffduffer.com/tags/science',
  ]

  it.each(sitePaths)('should return undefined for site page %s', (value) => {
    expect(parseHuffdufferUrl(value)).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseHuffdufferUrl('https://www.alice.huffduffer.com/alice')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHuffdufferUrl('https://example.com/alice')).toBeUndefined()
  })
})

describe('huffdufferHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://huffduffer.com/alice'],
      [false, 'https://huffduffer.com/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(huffdufferHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Huffduffer', () => {
      expect(huffdufferHandler.resolve('https://example.com/alice')).toEqual([])
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
})
