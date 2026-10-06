import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getPlonePage, isPloneHtml, type PlonePage, ploneHandler } from './plone.js'

const collectionHtml = `
  <head>
    <link rel="alternate" href="https://example.org/news/region-news/RSS" title="Region News - b'RSS 1.0'" type="application/rss+xml" />
    <link rel="alternate" href="https://example.org/news/region-news/rss.xml" title="Region News - b'RSS 2.0'" type="application/rss+xml" />
    <link rel="alternate" href="https://example.org/news/region-news/atom.xml" title="Region News - b'Atom'" type="application/rss+xml" />
  </head>
  <body
    class="frontend icons-on portaltype-collection section-news site-Plone subsection-region-news template-tabular_view thumbs-on userrole-anonymous viewpermission-view"
    data-base-url="https://example.org/news/region-news"
    data-portal-url="https://example.org"
  >
`
const plone4FolderHtml = `
  <head>
    <base href="https://example.org/impact/events/" />
    <meta name="generator" content="Plone - http://plone.org" />
  </head>
  <body class="template-folder_listing portaltype-folder site-Plone section-impact" dir="ltr">
    <a href="https://example.org/impact/events/RSS">RSS feed</a>
`
const siteHtml = `
  <head>
    <link rel="alternate" href="https://example.org/RSS" title="Example - RSS 1.0" type="application/rss+xml" />
  </head>
  <body
    class="template-document_view portaltype-document site-Plone section-front-page icons-on userrole-anonymous"
    data-portal-url="https://example.org"
    data-base-url="https://example.org/front-page"
  >
`
const subPathSiteHtml = `
  <body
    class="template-view portaltype-collective-cover-content site-pt-br section-home userrole-anonymous"
    data-base-url="https://example.org/agency/pt-br/home"
    data-portal-url="https://example.org/agency"
  >
`
const searchHtml = `
  <body
    class="template-search portaltype-plone-site site-Plone icons-on userrole-anonymous"
    data-base-url="https://example.org/agency"
    data-portal-url="https://example.org/agency"
  >
    <a href="https://example.org/agency/search_rss?SearchableText=privacy">Subscribe to an always-updated RSS feed.</a>
`
const plone4SearchHtml = `
  <head>
    <base href="https://example.org/varietytrials/" />
  </head>
  <body class="template-search portaltype-folder site-variety-trials icons-on userrole-anonymous">
    <a href="https://example.org/varietytrials/search_rss?Subject:list=Variety" class="link-feed">Subscribe</a>
`
const documentHtml = `
  <body
    class="frontend icons-on portaltype-document section-news template-document_view userrole-anonymous"
    data-base-url="https://example.org/news/main"
    data-portal-url="https://example.org"
  >
`
const voltoHtml = `
  <head>
    <meta name="generator" content="Plone 6 - https://plone.org"/>
  </head>
  <body class="view-viewview contenttype-document section-news is-anonymous public-ui">
`
const zopeHtml = `
  <head>
    <meta name="generator" content="Nexedi SA - Copyright (C) 2001 - 2015. All rights reserved." />
  </head>
  <body class="desktop">
`
const itemPortalTypes: Array<string> = [
  'portaltype-document',
  'portaltype-event',
  'portaltype-file',
  'portaltype-image',
  'portaltype-link',
  'portaltype-news-item',
]
const errorPageClasses: Array<string> = [
  'template-default_error_message portaltype-plone-site',
  'portaltype-plone-site template-error_message-pt',
]

describe('isPloneHtml', () => {
  it('should return true for a portaltype body class', () => {
    expect(isPloneHtml(collectionHtml)).toBe(true)
  })

  it('should return true for a Plone 4 body without data attributes', () => {
    expect(isPloneHtml(plone4FolderHtml)).toBe(true)
  })

  it('should return false for a Volto page', () => {
    expect(isPloneHtml(voltoHtml)).toBe(false)
  })

  it('should return false for a Zope site without Plone', () => {
    expect(isPloneHtml(zopeHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPloneHtml('')).toBe(false)
  })
})

describe('getPlonePage', () => {
  it('should return the portal and query of a search page', () => {
    const value = 'https://example.org/agency/@@search?SearchableText=privacy'
    const expected: PlonePage = {
      kind: 'search',
      portalUrl: 'https://example.org/agency',
      query: 'SearchableText=privacy',
    }

    expect(getPlonePage(value, searchHtml)).toEqual(expected)
  })

  it('should return the portal of a search page from the portal url', () => {
    const value = 'https://example.org/agency/news/@@search?SearchableText=privacy'
    const expected: PlonePage = {
      kind: 'search',
      portalUrl: 'https://example.org/agency',
      query: 'SearchableText=privacy',
    }

    expect(getPlonePage(value, searchHtml)).toEqual(expected)
  })

  it('should return the path before a Plone 4 search page as its portal', () => {
    const value = 'https://example.org/varietytrials/search?Subject:list=Variety'
    const expected: PlonePage = {
      kind: 'search',
      portalUrl: 'https://example.org/varietytrials',
      query: 'Subject:list=Variety',
    }

    expect(getPlonePage(value, plone4SearchHtml)).toEqual(expected)
  })

  it('should return the portal of a Plone 4 search page below it from the search link', () => {
    const value = 'https://example.org/varietytrials/barley/search?SearchableText=barley'
    const html = `
      <head>
        <base href="https://example.org/varietytrials/barley/" />
        <link rel="search" href="https://example.org/varietytrials/@@search" title="Search this site" />
      </head>
      <body class="template-search portaltype-topic site-variety-trials userrole-anonymous">
    `
    const expected: PlonePage = {
      kind: 'search',
      portalUrl: 'https://example.org/varietytrials',
      query: 'SearchableText=barley',
    }

    expect(getPlonePage(value, html)).toEqual(expected)
  })

  it('should prefer the body portal url over the search link', () => {
    const value = 'https://example.org/agency/ca/search?SearchableText=water'
    const html = `
      <head>
        <link href="https://example.org/agency/ca/@@search" rel="search" title="Search this site" />
      </head>
      <body class="portaltype-lrf template-search" data-base-url="https://example.org/agency/ca" data-portal-url="https://example.org/agency">
    `
    const expected: PlonePage = {
      kind: 'search',
      portalUrl: 'https://example.org/agency',
      query: 'SearchableText=water',
    }

    expect(getPlonePage(value, html)).toEqual(expected)
  })

  it('should return an empty query for a search page without one', () => {
    const value = 'https://example.org/varietytrials/@@search'
    const expected: PlonePage = {
      kind: 'search',
      portalUrl: 'https://example.org/varietytrials',
      query: '',
    }

    expect(getPlonePage(value, plone4SearchHtml)).toEqual(expected)
  })

  it('should return the site for its root with a default page', () => {
    const value = 'https://example.org/'
    const expected: PlonePage = { kind: 'site', portalUrl: 'https://example.org' }

    expect(getPlonePage(value, siteHtml)).toEqual(expected)
  })

  it('should return the site for a root under a sub-path', () => {
    const value = 'https://example.org/agency'
    const expected: PlonePage = { kind: 'site', portalUrl: 'https://example.org/agency' }

    expect(getPlonePage(value, subPathSiteHtml)).toEqual(expected)
  })

  it('should return the site for a view of the root context', () => {
    const value = 'https://example.org/agency/folder_contents'
    const html = searchHtml.replace('template-search', 'template-folder_contents')
    const expected: PlonePage = { kind: 'site', portalUrl: 'https://example.org/agency' }

    expect(getPlonePage(value, html)).toEqual(expected)
  })

  it('should return the context of a collection page', () => {
    const value = 'https://example.org/news/region-news'
    const expected: PlonePage = {
      kind: 'folder',
      folderUrl: 'https://example.org/news/region-news',
    }

    expect(getPlonePage(value, collectionHtml)).toEqual(expected)
  })

  it('should return the context of a collection page under a view name', () => {
    const value = 'https://example.org/news/region-news/tabular_view'
    const expected: PlonePage = {
      kind: 'folder',
      folderUrl: 'https://example.org/news/region-news',
    }

    expect(getPlonePage(value, collectionHtml)).toEqual(expected)
  })

  it('should return the context of a Plone 4 folder from its base', () => {
    const value = 'https://example.org/impact/events'
    const expected: PlonePage = { kind: 'folder', folderUrl: 'https://example.org/impact/events' }

    expect(getPlonePage(value, plone4FolderHtml)).toEqual(expected)
  })

  it('should return the site for a Plone 4 root', () => {
    const value = 'https://example.org/'
    const html = plone4SearchHtml.replace('/varietytrials/', '/')
    const expected: PlonePage = { kind: 'site', portalUrl: 'https://example.org' }

    expect(getPlonePage(value, html)).toEqual(expected)
  })

  it.each(itemPortalTypes)('should return undefined for a %s page', (portalType) => {
    const value = 'https://example.org/news/main'
    const html = documentHtml.replace('portaltype-document', portalType)

    expect(getPlonePage(value, html)).toBeUndefined()
  })

  it.each(errorPageClasses)('should return undefined for an error page with %s', (classes) => {
    const value = 'https://example.org/no-such-folder'
    const html = `<body class="${classes}" data-base-url="https://example.org" data-portal-url="https://example.org">`

    expect(getPlonePage(value, html)).toBeUndefined()
  })

  it('should return the folder for a page whose classes name an error section', () => {
    const value = 'https://example.org/errors'
    const html =
      '<body class="portaltype-folder section-errors template-error_log_form" data-base-url="https://example.org/errors" data-portal-url="https://example.org">'
    const expected: PlonePage = { kind: 'folder', folderUrl: 'https://example.org/errors' }

    expect(getPlonePage(value, html)).toEqual(expected)
  })

  it('should return undefined for a page without a context url', () => {
    const value = 'https://example.org/news'
    const html = '<body class="portaltype-folder">'

    expect(getPlonePage(value, html)).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(getPlonePage('not-a-url', collectionHtml)).toBeUndefined()
  })
})

describe('ploneHandler', () => {
  describe('match', () => {
    it('should match a Plone collection page', () => {
      const value = 'https://example.org/news/region-news'

      expect(ploneHandler.match(value, collectionHtml)).toBe(true)
    })

    it('should not match a Plone document page', () => {
      const value = 'https://example.org/news'

      expect(ploneHandler.match(value, documentHtml)).toBe(false)
    })

    it('should not match a Volto page', () => {
      const value = 'https://example.org/news'

      expect(ploneHandler.match(value, voltoHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the search feed with the page query', async () => {
      const value = 'https://example.org/agency/@@search?SearchableText=privacy'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/agency/search_rss?SearchableText=privacy',
          hint: { key: 'plone:search', label: 'Search' },
        },
      ]

      expect(await ploneHandler.resolve(value, searchHtml)).toEqual(expected)
    })

    it('should return the site feeds', async () => {
      const value = 'https://example.org/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/RSS',
          hint: { key: 'plone:site', label: 'Site', format: 'rdf' },
        },
        {
          uri: 'https://example.org/rss.xml',
          hint: { key: 'plone:site', label: 'Site', format: 'rss' },
        },
        {
          uri: 'https://example.org/atom.xml',
          hint: { key: 'plone:site', label: 'Site', format: 'atom' },
        },
      ]

      expect(await ploneHandler.resolve(value, siteHtml)).toEqual(expected)
    })

    it('should return the folder feeds', async () => {
      const value = 'https://example.org/news/region-news'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/news/region-news/RSS',
          hint: { key: 'plone:folder', label: 'Folder', format: 'rdf' },
        },
        {
          uri: 'https://example.org/news/region-news/rss.xml',
          hint: { key: 'plone:folder', label: 'Folder', format: 'rss' },
        },
        {
          uri: 'https://example.org/news/region-news/atom.xml',
          hint: { key: 'plone:folder', label: 'Folder', format: 'atom' },
        },
      ]

      expect(await ploneHandler.resolve(value, collectionHtml)).toEqual(expected)
    })

    it('should return nothing for a document page', async () => {
      const value = 'https://example.org/news'

      expect(await ploneHandler.resolve(value, documentHtml)).toEqual([])
    })
  })
})
