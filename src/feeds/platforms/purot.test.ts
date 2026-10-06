import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PurotPage, PurotUrl } from './purot.js'
import { getPurotPage, parsePurotUrl, purotHandler } from './purot.js'

const pageHtml = `
  <head>
    <title>Kevätjuhla | example | Purot.net wiki</title>
    <base href="https://example.purot.net/" />
    <link
      rel="alternate"
      href="/changes/all?mode=rss"
      title="All recent changes RSS"
      type="application/rss+xml"
    />
    <link
      rel="alternate"
      href="/changes/kevatjuhla?mode=rss&messages=0"
      title="Page changes RSS"
      type="application/rss+xml"
    />
    <link
      rel="alternate"
      href="/changes/kevatjuhla?mode=rss&pages=0"
      title="Page discussions RSS"
      type="application/rss+xml"
    />
    <link
      rel="alternate"
      href="/changes/kevatjuhla?mode=rss"
      title="Changes, discussions and likes RSS"
      type="application/rss+xml"
    />
  </head>
`
const homeHtml = `
  <head>
    <title>Etusivu | example | Purot.net wiki</title>
    <link
      rel="alternate"
      href="/changes/all?mode=rss"
      title="All recent changes RSS"
      type="application/rss+xml"
    />
    <link
      rel="alternate"
      href="/changes/etusivu?mode=rss&messages=0"
      title="Page changes RSS"
      type="application/rss+xml"
    />
  </head>
`
const missingProfileHtml = `
  <head>
    <title>User not found | example | Purot.net wiki</title>
    <link
      rel="alternate"
      href="/changes/all?mode=rss"
      title="All recent changes RSS"
      type="application/rss+xml"
    />
    <link
      rel="alternate"
      href="/changes/profile/alice?mode=rss&messages=0"
      title="Page changes RSS"
      type="application/rss+xml"
    />
  </head>
`
const anchorOnlyHtml = `
  <body>
    <a href="/changes/kevatjuhla?mode=rss&messages=0">Page changes RSS</a>
  </body>
`

describe('parsePurotUrl', () => {
  it('should return the wiki for a wiki subdomain', () => {
    const expected: PurotUrl = { kind: 'wiki', wiki: 'example' }

    expect(parsePurotUrl('https://example.purot.net/kevatjuhla')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parsePurotUrl('https://purot.net/')).toBeUndefined()
  })

  const serviceHosts = ['https://www.purot.net/', 'https://my.purot.net/login.php']

  it.each(serviceHosts)('should return undefined for service host %s', (value) => {
    expect(parsePurotUrl(value)).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parsePurotUrl('https://www.example.purot.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePurotUrl('https://example.com/')).toBeUndefined()
  })
})

describe('getPurotPage', () => {
  it('should return the page its feed link names', () => {
    const expected: PurotPage = { kind: 'page', wiki: 'example', page: 'kevatjuhla' }

    expect(getPurotPage('https://example.purot.net/kevatjuhla', pageHtml)).toEqual(expected)
  })

  it('should return the front page for the home page', () => {
    const expected: PurotPage = { kind: 'page', wiki: 'example', page: 'etusivu' }

    expect(getPurotPage('https://example.purot.net/', homeHtml)).toEqual(expected)
  })

  it('should spell the page as its feed link does for a url in another case', () => {
    const expected: PurotPage = { kind: 'page', wiki: 'example', page: 'kevatjuhla' }

    expect(getPurotPage('https://example.purot.net/Kevatjuhla', pageHtml)).toEqual(expected)
  })

  it('should return the wiki for a profile page', () => {
    const value = 'https://example.purot.net/profile/alice'
    const expected: PurotPage = { kind: 'wiki', wiki: 'example' }

    expect(getPurotPage(value, missingProfileHtml)).toEqual(expected)
  })

  it('should return the wiki for a page linking its feed only from an anchor', () => {
    const value = 'https://example.purot.net/kevatjuhla'
    const expected: PurotPage = { kind: 'wiki', wiki: 'example' }

    expect(getPurotPage(value, anchorOnlyHtml)).toEqual(expected)
  })

  const foreignLinks = [
    '<link rel="alternate" href="https://other.purot.net/changes/kevatjuhla?mode=rss&messages=0" />',
    '<link rel="alternate" href="/changes/kevatjuhla?mode=rss&messages=0&pages=0" />',
  ]

  it.each(foreignLinks)(
    'should return the wiki for a link that is not the page changes feed %s',
    (value) => {
      const expected: PurotPage = { kind: 'wiki', wiki: 'example' }

      expect(getPurotPage('https://example.purot.net/kevatjuhla', value)).toEqual(expected)
    },
  )

  it('should return the wiki without content', () => {
    const expected: PurotPage = { kind: 'wiki', wiki: 'example' }

    expect(getPurotPage('https://example.purot.net/kevatjuhla', undefined)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(getPurotPage('https://example.com/kevatjuhla', pageHtml)).toBeUndefined()
  })
})

describe('purotHandler', () => {
  describe('match', () => {
    it('should return true for a wiki', () => {
      expect(purotHandler.match('https://example.purot.net/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(purotHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the page and wiki feeds for a page', () => {
      const value = 'https://example.purot.net/kevatjuhla'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.purot.net/changes/kevatjuhla?mode=rss&messages=0',
          hint: { key: 'purot:page-changes', label: 'Page changes' },
        },
        {
          uri: 'https://example.purot.net/changes/kevatjuhla?mode=rss&pages=0',
          hint: { key: 'purot:page-discussions', label: 'Page discussions' },
        },
        {
          uri: 'https://example.purot.net/changes/kevatjuhla?mode=rss',
          hint: { key: 'purot:page-activity', label: 'Page changes, discussions and likes' },
        },
        {
          uri: 'https://example.purot.net/changes/all?mode=rss',
          hint: { key: 'purot:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(purotHandler.resolve(value, pageHtml)).toEqual(expected)
    })

    it('should return the wiki feed for a profile page', () => {
      const value = 'https://example.purot.net/profile/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.purot.net/changes/all?mode=rss',
          hint: { key: 'purot:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(purotHandler.resolve(value, missingProfileHtml)).toEqual(expected)
    })

    it('should return empty array for a URL outside purot.net', () => {
      expect(purotHandler.resolve('https://example.com/', pageHtml)).toEqual([])
    })
  })
})
