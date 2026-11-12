import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  it('should return undefined for the www host', () => {
    expect(parsePurotUrl('https://www.purot.net/')).toBeUndefined()
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

  it('should return the page a feed link in uppercase names', () => {
    const content = '<link rel="alternate" href="/changes/kevatjuhla?MODE=RSS&MESSAGES=0" />'
    const expected: PurotPage = { kind: 'page', wiki: 'example', page: 'kevatjuhla' }

    expect(getPurotPage('https://example.purot.net/kevatjuhla', content)).toEqual(expected)
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

  it('should escape a space in the page its feed link names', () => {
    const value = 'https://example.purot.net/kevatjuhla'
    const content = '<link rel="alternate" href="/changes/kevat juhla?mode=rss&messages=0" />'
    const expected: PurotPage = { kind: 'page', wiki: 'example', page: 'kevat%20juhla' }

    expect(getPurotPage(value, content)).toEqual(expected)
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

    it('should return the wiki feed under the page scheme for an http profile page', () => {
      const value = 'http://example.purot.net/profile/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.purot.net/changes/all?mode=rss',
          hint: { key: 'purot:recent-changes', label: 'Recent changes' },
        },
      ]

      expect(purotHandler.resolve(value, missingProfileHtml)).toEqual(expected)
    })

    it('should return empty array for a URL outside purot.net', () => {
      expect(purotHandler.resolve('https://example.com/', pageHtml)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the recent changes hint for the wiki feed', () => {
      const value = 'https://example.purot.net/changes/all?mode=rss'
      const expected: DiscoverUriHint = { key: 'purot:recent-changes', label: 'Recent changes' }

      expect(purotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the page changes hint for a page changes feed', () => {
      const value = 'https://example.purot.net/changes/kevatjuhla?messages=0&mode=rss'
      const expected: DiscoverUriHint = { key: 'purot:page-changes', label: 'Page changes' }

      expect(purotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the page discussions hint for a page discussions feed', () => {
      const value = 'https://example.purot.net/changes/kevatjuhla?mode=rss&pages=0'
      const expected: DiscoverUriHint = { key: 'purot:page-discussions', label: 'Page discussions' }

      expect(purotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the page activity hint for a page activity feed', () => {
      const value = 'https://example.purot.net/changes/kevatjuhla?mode=rss'
      const expected: DiscoverUriHint = {
        key: 'purot:page-activity',
        label: 'Page changes, discussions and likes',
      }

      expect(purotHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile feed', () => {
      const value = 'https://example.purot.net/changes/profile/alice?mode=rss'

      expect(purotHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a changes page', () => {
      const value = 'https://example.purot.net/changes/kevatjuhla'

      expect(purotHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex domain', () => {
      const value = 'https://purot.net/changes/all?mode=rss'

      expect(purotHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/changes/all?mode=rss'

      expect(purotHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const recentChanges = {
      key: 'purot:recent-changes',
      label: 'Recent changes',
    }
    const pageChanges = {
      key: 'purot:page-changes',
      label: 'Page changes',
    }
    const pageDiscussions = {
      key: 'purot:page-discussions',
      label: 'Page discussions',
    }
    const pageActivity = {
      key: 'purot:page-activity',
      label: 'Page changes, discussions and likes',
    }
    const values: Array<[string, DiscoverUriEntry['hint']]> = [
      ['https://example.purot.net/changes/all?mode=rss', recentChanges],
      ['http://example.purot.net/changes/all?mode=rss', recentChanges],
      ['https://example.purot.net/changes/kevatjuhla?mode=rss&messages=0', pageChanges],
      ['https://example.purot.net/changes/kevatjuhla?messages=0&mode=rss', pageChanges],
      ['https://example.purot.net/changes/kevatjuhla?mode=rss&pages=0', pageDiscussions],
      ['https://example.purot.net/changes/kevatjuhla?mode=rss', pageActivity],
    ]

    it.each(values)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [purotHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
