import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type GeoblogUrl, geoblogHandler, parseGeoblogUrl } from './geoblog.js'

const tripPage = `
  <div id="linkPath">
    <a href="http://www.geoblog.pl" title="Geoblog.pl">Geoblog.pl</a>
    <a href="/" title="alice">alice</a>
    <a href="/podroze" title="Podróże">Podróże</a>
    <a href="/podroz/12345/majorka-2024" title="Majorka 2024">Majorka 2024</a>
  </div>
  <a href="/podroz/rss/12345.xml">RSS</a>
`

const entryPage = `
  <div id="linkPath">
    <a href="http://www.geoblog.pl" title="Geoblog.pl">Geoblog.pl</a>
    <a href="/" title="alice">alice</a>
    <a href="/podroze" title="Podróże">Podróże</a>
    <a href="/podroz/12345/majorka-2024" title="Majorka 2024">Majorka 2024</a>
    <a href="/wpis/67890/na-plazy" class="b" title="Na plaży">Na plaży</a>
  </div>
  <div class="userJournals">
    <div class="title"><a href="http://alice.geoblog.pl/podroz/54321/islandia-2025">Islandia 2025</a></div>
  </div>
`

const sidebarOnlyPage = `
  <div id="linkPath">
    <a href="/" title="alice">alice</a>
  </div>
  <div class="userJournals">
    <div class="title"><a href="http://alice.geoblog.pl/podroz/54321/islandia-2025">Islandia 2025</a></div>
  </div>
`

describe('parseGeoblogUrl', () => {
  it('should return the trip for a trip page', () => {
    const expected: GeoblogUrl = { kind: 'trip' }

    expect(parseGeoblogUrl('http://alice.geoblog.pl/podroz/12345/majorka-2024')).toEqual(expected)
  })

  it('should return the trip for a trip page without a slug', () => {
    const expected: GeoblogUrl = { kind: 'trip' }

    expect(parseGeoblogUrl('http://alice.geoblog.pl/podroz/12345')).toEqual(expected)
  })

  it('should return the entry for an entry page', () => {
    const expected: GeoblogUrl = { kind: 'entry' }

    expect(parseGeoblogUrl('http://alice.geoblog.pl/wpis/67890/na-plazy')).toEqual(expected)
  })

  const pagesWithoutTrip = [
    'http://alice.geoblog.pl/',
    'http://alice.geoblog.pl/podroze',
    'http://alice.geoblog.pl/podroz/rss/12345.xml',
    'http://alice.geoblog.pl/podroz/kml/12345.kml',
    'http://alice.geoblog.pl/wpis/na-plazy',
  ]

  it.each(pagesWithoutTrip)('should return undefined for %s', (value) => {
    expect(parseGeoblogUrl(value)).toBeUndefined()
  })

  const serviceHosts = [
    'http://www.geoblog.pl/podroz/12345/majorka-2024',
    'http://admin.geoblog.pl/podroz/12345/majorka-2024',
    'http://cdn.geoblog.pl/podroz/12345/majorka-2024',
  ]

  it.each(serviceHosts)('should return undefined for service host %s', (value) => {
    expect(parseGeoblogUrl(value)).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    const value = 'http://www.alice.geoblog.pl/podroz/12345/majorka-2024'

    expect(parseGeoblogUrl(value)).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseGeoblogUrl('http://geoblog.pl/podroz/12345/majorka-2024')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseGeoblogUrl('https://example.com/podroz/12345/majorka-2024')).toBeUndefined()
  })
})

describe('geoblogHandler', () => {
  describe('match', () => {
    it('should return true for an entry page linking its trip', () => {
      expect(geoblogHandler.match('http://alice.geoblog.pl/wpis/67890/na-plazy', entryPage)).toBe(
        true,
      )
    })

    it('should return false for an entry page without content', () => {
      expect(geoblogHandler.match('http://alice.geoblog.pl/wpis/67890/na-plazy')).toBe(false)
    })

    it('should return false for a user home page', () => {
      expect(geoblogHandler.match('http://alice.geoblog.pl/', tripPage)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the trip feed for a trip page', () => {
      const value = 'http://alice.geoblog.pl/podroz/12345/majorka-2024'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.geoblog.pl/podroz/rss/12345.xml',
          hint: { key: 'geoblog:trip', label: 'Trip' },
        },
      ]

      expect(geoblogHandler.resolve(value, tripPage)).toEqual(expected)
    })

    it('should return the trip feed of the breadcrumb trip for an entry page', () => {
      const value = 'http://alice.geoblog.pl/wpis/67890/na-plazy'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.geoblog.pl/podroz/rss/12345.xml',
          hint: { key: 'geoblog:trip', label: 'Trip' },
        },
      ]

      expect(geoblogHandler.resolve(value, entryPage)).toEqual(expected)
    })

    it('should return empty array for an entry page linking other trips only', () => {
      const value = 'http://alice.geoblog.pl/wpis/67890/na-plazy'

      expect(geoblogHandler.resolve(value, sidebarOnlyPage)).toEqual([])
    })

    it('should return empty array for a page outside Geoblog.pl', () => {
      expect(geoblogHandler.resolve('https://example.com/podroz/12345/x', tripPage)).toEqual([])
    })
  })
})
