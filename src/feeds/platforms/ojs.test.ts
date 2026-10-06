import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getOjsPage, isOjsHeaders, isOjsHtml, type OjsPage, ojsHandler } from './ojs.js'

const generatorMeta = '<meta name="generator" content="Open Journal Systems 3.3.0.20">'
const journalHtml = `
  <head>
    <meta
      name="generator"
      content="Open Journal Systems 3.3.0.20"
    >
    <link
      rel="stylesheet"
      href="https://example.com/index.php/journal/$$$call$$$/page/page/css?name=stylesheet"
      type="text/css"
    >
  </head>
`
const rewrittenJournalHtml = `
  <head>
    <meta
      name="generator"
      content="Open Journal Systems 3.3.0.21"
    />
    <link
      rel="stylesheet"
      href="https://example.com/journal/$$$call$$$/page/page/css?name=stylesheet"
      type="text/css"
    />
  </head>
`
const domainJournalHtml = `
  <head>
    <link
      rel="stylesheet"
      href="https://example.com/$$$call$$$/page/page/css?name=stylesheet"
      type="text/css"
    />
  </head>
`
const localeHomeHtml = `
  <head>
    <meta
      name="generator"
      content="Open Journal Systems 3.5.0.4"
    />
    <link
      rel="stylesheet"
      href="https://example.com/journal/$$$call$$$/page/page/css?name=stylesheet"
      type="text/css"
    />
    <link
      rel="alternate"
      hreflang="en"
      href="https://example.com/journal/en"
    />
    <link
      rel="alternate"
      hreflang="es"
      href="https://example.com/journal/es"
    />
    <link
      rel="alternate"
      hreflang="x-default"
      href="https://example.com/journal"
    />
  </head>
`
const localeArticleHtml = `
  <head>
    <meta
      name="generator"
      content="Open Journal Systems 3.5.0.4"
    />
    <link
      rel="stylesheet"
      href="https://example.com/journal/$$$call$$$/page/page/css?name=stylesheet"
      type="text/css"
    />
    <link
      rel="alternate"
      hreflang="en"
      href="https://example.com/journal/en/article/view/1"
    />
    <link
      rel="alternate"
      hreflang="es"
      href="https://example.com/journal/es/article/view/1"
    />
    <link
      rel="alternate"
      hreflang="x-default"
      href="https://example.com/journal/article/view/1"
    />
  </head>
`
const siteHtml = `
  <head>
    <meta
      name="generator"
      content="Open Journal Systems 3.3.0.20"
    >
    <link
      rel="stylesheet"
      href="https://example.com/index.php/index/$$$call$$$/page/page/css?name=stylesheet"
      type="text/css"
    >
  </head>
`
const preprintHtml = `
  <head>
    <meta
      name="generator"
      content="Open Preprint Systems 3.4.6.2"
    />
  </head>
`
const sessionHeaders = new Headers({
  'set-cookie': 'OJSSID=aoij9oleppg37koheh70eb6a83; path=/; domain=example.com',
})
const monographHeaders = new Headers({
  'set-cookie': 'OMPSID=86a7hl0ivg28la90fah2n84fjc; path=/; domain=example.com',
})

describe('isOjsHtml', () => {
  it('should return true for the generator meta', () => {
    expect(isOjsHtml(generatorMeta)).toBe(true)
  })

  it('should return false for Open Preprint Systems', () => {
    expect(isOjsHtml(preprintHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isOjsHtml('')).toBe(false)
  })
})

describe('isOjsHeaders', () => {
  it('should return true for the session cookie', () => {
    expect(isOjsHeaders(sessionHeaders)).toBe(true)
  })

  it('should return false for the session cookie of Open Monograph Press', () => {
    expect(isOjsHeaders(monographHeaders)).toBe(false)
  })
})

describe('getOjsPage', () => {
  it('should return the journal root under index.php', () => {
    const expected: OjsPage = {
      kind: 'journal',
      journalUrl: 'https://example.com/index.php/journal',
    }

    expect(getOjsPage(journalHtml)).toEqual(expected)
  })

  it('should return the journal root of a rewritten install', () => {
    const expected: OjsPage = { kind: 'journal', journalUrl: 'https://example.com/journal' }

    expect(getOjsPage(rewrittenJournalHtml)).toEqual(expected)
  })

  it('should return the origin for a journal on its own domain', () => {
    const expected: OjsPage = { kind: 'journal', journalUrl: 'https://example.com' }

    expect(getOjsPage(domainJournalHtml)).toEqual(expected)
  })

  it('should return the journal root of a 3.5 journal home with locale alternates', () => {
    const expected: OjsPage = { kind: 'journal', journalUrl: 'https://example.com/journal' }

    expect(getOjsPage(localeHomeHtml)).toEqual(expected)
  })

  it('should return the journal root of a 3.5 article page with locale alternates', () => {
    const expected: OjsPage = { kind: 'journal', journalUrl: 'https://example.com/journal' }

    expect(getOjsPage(localeArticleHtml)).toEqual(expected)
  })

  it('should return undefined for the site pages of a multi-journal install', () => {
    expect(getOjsPage(siteHtml)).toBeUndefined()
  })

  it('should return undefined without the component router stylesheet', () => {
    expect(getOjsPage(generatorMeta)).toBeUndefined()
  })
})

describe('ojsHandler', () => {
  describe('match', () => {
    it('should match a journal page by the generator meta', () => {
      expect(ojsHandler.match('https://example.com/index.php/journal', journalHtml)).toBe(true)
    })

    it('should match a journal page by the session cookie', () => {
      const value = 'https://example.com/article/view/1'

      expect(ojsHandler.match(value, domainJournalHtml, sessionHeaders)).toBe(true)
    })

    it('should not match a page without the marker', () => {
      expect(ojsHandler.match('https://example.com/article/view/1', domainJournalHtml)).toBe(false)
    })

    it('should not match the site pages of a multi-journal install', () => {
      expect(ojsHandler.match('https://example.com/index.php/index', siteHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a page with no journal', () => {
      expect(ojsHandler.resolve('https://example.com/index.php/index', siteHtml)).toEqual([])
    })

    it('should return the article and announcement feeds of the journal', () => {
      const value = 'https://example.com/index.php/journal/article/view/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/index.php/journal/gateway/plugin/WebFeedGatewayPlugin/atom',
          hint: { key: 'ojs:articles', label: 'Articles', format: 'atom' },
        },
        {
          uri: 'https://example.com/index.php/journal/gateway/plugin/WebFeedGatewayPlugin/rss',
          hint: { key: 'ojs:articles', label: 'Articles', format: 'rdf' },
        },
        {
          uri: 'https://example.com/index.php/journal/gateway/plugin/WebFeedGatewayPlugin/rss2',
          hint: { key: 'ojs:articles', label: 'Articles', format: 'rss' },
        },
        {
          uri: 'https://example.com/index.php/journal/gateway/plugin/AnnouncementFeedGatewayPlugin/atom',
          hint: { key: 'ojs:announcements', label: 'Announcements', format: 'atom' },
        },
        {
          uri: 'https://example.com/index.php/journal/gateway/plugin/AnnouncementFeedGatewayPlugin/rss',
          hint: { key: 'ojs:announcements', label: 'Announcements', format: 'rdf' },
        },
        {
          uri: 'https://example.com/index.php/journal/gateway/plugin/AnnouncementFeedGatewayPlugin/rss2',
          hint: { key: 'ojs:announcements', label: 'Announcements', format: 'rss' },
        },
      ]

      expect(ojsHandler.resolve(value, journalHtml)).toEqual(expected)
    })

    it('should return the journal root feeds of a 3.5 article page under a locale', () => {
      const value = 'https://example.com/journal/es/article/view/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/journal/gateway/plugin/WebFeedGatewayPlugin/atom',
          hint: { key: 'ojs:articles', label: 'Articles', format: 'atom' },
        },
        {
          uri: 'https://example.com/journal/gateway/plugin/WebFeedGatewayPlugin/rss',
          hint: { key: 'ojs:articles', label: 'Articles', format: 'rdf' },
        },
        {
          uri: 'https://example.com/journal/gateway/plugin/WebFeedGatewayPlugin/rss2',
          hint: { key: 'ojs:articles', label: 'Articles', format: 'rss' },
        },
        {
          uri: 'https://example.com/journal/gateway/plugin/AnnouncementFeedGatewayPlugin/atom',
          hint: { key: 'ojs:announcements', label: 'Announcements', format: 'atom' },
        },
        {
          uri: 'https://example.com/journal/gateway/plugin/AnnouncementFeedGatewayPlugin/rss',
          hint: { key: 'ojs:announcements', label: 'Announcements', format: 'rdf' },
        },
        {
          uri: 'https://example.com/journal/gateway/plugin/AnnouncementFeedGatewayPlugin/rss2',
          hint: { key: 'ojs:announcements', label: 'Announcements', format: 'rss' },
        },
      ]

      expect(ojsHandler.resolve(value, localeArticleHtml)).toEqual(expected)
    })
  })
})
