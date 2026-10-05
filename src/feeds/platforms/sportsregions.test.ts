import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  it('should return undefined for the portal', () => {
    expect(parseSportsregionsUrl('https://www.sportsregions.fr/')).toBeUndefined()
  })

  it('should return undefined for the help center', () => {
    expect(parseSportsregionsUrl('https://aide.sportsregions.fr/')).toBeUndefined()
  })

  const serviceSubdomains: Array<string> = [
    'admin',
    'aide',
    'beta',
    'imap',
    'mail',
    'pop',
    'portail',
    'smtp',
    'video',
    'videos',
    'webmail',
    'www',
  ]

  it.each(serviceSubdomains)('should return undefined for the %s service host', (subdomain) => {
    expect(parseSportsregionsUrl(`https://${subdomain}.sportsregions.fr/`)).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseSportsregionsUrl('https://sportsregions.fr/')).toBeUndefined()
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

    it('should return false for a custom domain without the footer link', () => {
      expect(sportsregionsHandler.match('https://example.com/', '<p>Club</p>')).toBe(false)
    })

    it('should return false for the portal with the footer link', () => {
      expect(sportsregionsHandler.match('https://portail.sportsregions.fr/', clubHtml)).toBe(false)
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
  })
})
