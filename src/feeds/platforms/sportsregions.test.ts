import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  isSportsregionsHtml,
  parseSportsregionsUrl,
  type SportsregionsUrl,
  sportsregionsHandler,
} from './sportsregions.js'

const clubHtml = `
  <nav id="cookies">
    <ul>
      <li>
        <a
          href="https://www.sportsregions.fr/charte-cookies"
          class="informations-legales"
        >Charte cookies</a>
      </li>
      <li>
        <a href="https://www.sportsregions.fr/signaler-un-contenu-inapproprie?k=123456789">
          Signaler un contenu inapproprié
        </a>
      </li>
    </ul>
  </nav>
`

describe('isSportsregionsHtml', () => {
  it('should return true for the content report link in the footer', () => {
    expect(isSportsregionsHtml(clubHtml)).toBe(true)
  })

  it('should return false for a page without the link', () => {
    expect(isSportsregionsHtml('<a href="https://www.sportsregions.fr/inscription">Club</a>')).toBe(
      false,
    )
  })
})

describe('parseSportsregionsUrl', () => {
  it('should return the club for a club subdomain', () => {
    const expected: SportsregionsUrl = { kind: 'club' }

    expect(parseSportsregionsUrl('https://example-club.sportsregions.fr/')).toEqual(expected)
  })

  it('should return the club for a club article', () => {
    const value = 'https://example-club.sportsregions.fr/saison-2026-2027/actualites-du-club/a-1'
    const expected: SportsregionsUrl = { kind: 'club' }

    expect(parseSportsregionsUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parseSportsregionsUrl('https://www.sportsregions.fr/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSportsregionsUrl('https://sportsregions.fr/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseSportsregionsUrl('https://www.example.sportsregions.fr/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSportsregionsUrl('https://example.com/')).toBeUndefined()
  })
})

describe('sportsregionsHandler', () => {
  describe('match', () => {
    it('should return true for a club subdomain without content', () => {
      expect(sportsregionsHandler.match('https://example-club.sportsregions.fr/')).toBe(true)
    })

    it('should return true for a custom domain with the footer link', () => {
      expect(sportsregionsHandler.match('https://example.com/', clubHtml)).toBe(true)
    })

    it('should return false for the www host with the footer link', () => {
      const value = 'https://www.sportsregions.fr/'

      expect(sportsregionsHandler.match(value, clubHtml)).toBe(false)
    })

    it('should return false for a custom domain without the footer link', () => {
      expect(sportsregionsHandler.match('https://example.com/', '<p>Club</p>')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return news and events feeds for a club subdomain', () => {
      const value = 'https://example-club.sportsregions.fr/saison-2026-2027/actualites-du-club'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example-club.sportsregions.fr/rss/news',
          hint: { key: 'sportsregions:news', label: 'News' },
        },
        {
          uri: 'https://example-club.sportsregions.fr/rss/evenement',
          hint: { key: 'sportsregions:events', label: 'Events' },
        },
      ]

      expect(sportsregionsHandler.resolve(value)).toEqual(expected)
    })

    it('should return news and events feeds for a custom domain', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/rss/news',
          hint: { key: 'sportsregions:news', label: 'News' },
        },
        {
          uri: 'https://www.example.com/rss/evenement',
          hint: { key: 'sportsregions:events', label: 'Events' },
        },
      ]

      expect(sportsregionsHandler.resolve('https://www.example.com/', clubHtml)).toEqual(expected)
    })

    it('should keep the http scheme of a club subdomain opened over http', () => {
      const value = 'http://example-club.sportsregions.fr/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example-club.sportsregions.fr/rss/news',
          hint: { key: 'sportsregions:news', label: 'News' },
        },
        {
          uri: 'http://example-club.sportsregions.fr/rss/evenement',
          hint: { key: 'sportsregions:events', label: 'Events' },
        },
      ]

      expect(sportsregionsHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a custom domain', () => {
      const value = 'http://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.com/rss/news',
          hint: { key: 'sportsregions:news', label: 'News' },
        },
        {
          uri: 'http://example.com/rss/evenement',
          hint: { key: 'sportsregions:events', label: 'Events' },
        },
      ]

      expect(sportsregionsHandler.resolve(value, clubHtml)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the news hint for the news feed of a club', () => {
      const value = 'https://example-club.sportsregions.fr/rss/news'
      const expected: DiscoverUriHint = { key: 'sportsregions:news', label: 'News' }

      expect(sportsregionsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events hint for the events feed of a club', () => {
      const value = 'https://example-club.sportsregions.fr/rss/evenement'
      const expected: DiscoverUriHint = { key: 'sportsregions:events', label: 'Events' }

      expect(sportsregionsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events hint for the events feed of a club over http', () => {
      const value = 'http://example-club.sportsregions.fr/rss/evenement'
      const expected: DiscoverUriHint = { key: 'sportsregions:events', label: 'Events' }

      expect(sportsregionsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events hint for the events feed filtered by group and type', () => {
      const value = 'https://example-club.sportsregions.fr/rss/evenement?groupe_id=12345&type_id=2'
      const expected: DiscoverUriHint = { key: 'sportsregions:events', label: 'Events' }

      expect(sportsregionsHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page of a club', () => {
      const value = 'https://example-club.sportsregions.fr/saison-2026-2027/actualites-du-club'

      expect(sportsregionsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the news path on the www host', () => {
      const value = 'https://www.sportsregions.fr/rss/news'

      expect(sportsregionsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the news path on a nested subdomain', () => {
      const value = 'https://example.club.sportsregions.fr/rss/news'

      expect(sportsregionsHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the news feed of a custom domain', () => {
      const value = 'https://example.com/rss/news'

      expect(sportsregionsHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const newsHint: DiscoverUriHint = { key: 'sportsregions:news', label: 'News' }
    const eventsHint: DiscoverUriHint = { key: 'sportsregions:events', label: 'Events' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example-club.sportsregions.fr/rss/news', newsHint],
      ['http://example-club.sportsregions.fr/rss/news', newsHint],
      ['https://example-club.sportsregions.fr/rss/evenement', eventsHint],
      ['https://example-club.sportsregions.fr/rss/evenement/', eventsHint],
      ['https://example-club.sportsregions.fr/rss/evenement?type_evenement_id=1', eventsHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [sportsregionsHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
