import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getOmekaPage, isOmekaHtml, type OmekaPage, omekaHandler } from './omeka.js'

const omekaHtml = `
  <head>
    <link
      href="/plugins/GoogleAnalytics/views/public/css/googleanalytics.css?v=3.2.1"
      media="all"
      rel="stylesheet"
      type="text/css"
    >
  </head>
`
const omekaSubPathHtml = `
  <head>
    <link
      href="/biblioteca/plugins/ConnectedCarousel/views/public/css/slick.css?v=2.7.1"
      media="all"
      rel="stylesheet"
      type="text/css"
    >
  </head>
`
const omekaAbsoluteHtml = `
  <head>
    <link
      href="https://example.com/plugins/Html5Media/views/shared/mediaelement/mediaelementplayer.css"
      media="all"
      rel="stylesheet"
      type="text/css"
    >
  </head>
`
const omekaCoreHtml = `
  <head>
    <link
      href="/application/views/scripts/css/public.css?v=3.1.2"
      media="all"
      rel="stylesheet"
      type="text/css"
    >
  </head>
`
const wordpressPluginHtml = `
  <script src="https://shop.example/wp-content/plugins/campaign-monitor-for-woocommerce/views/public/js/app.js?ver=1.5"></script>
`
const otherHtml = `
  <head>
    <link
      href="/wp-content/plugins/jetpack/css/jetpack.css"
      rel="stylesheet"
    >
  </head>
`

describe('isOmekaHtml', () => {
  it('should return true for a plugin public view asset', () => {
    expect(isOmekaHtml(omekaHtml)).toBe(true)
  })

  it('should return true for a plugin shared view asset', () => {
    expect(isOmekaHtml(omekaAbsoluteHtml)).toBe(true)
  })

  it('should return true for a core script asset', () => {
    expect(isOmekaHtml(omekaCoreHtml)).toBe(true)
  })

  it('should return false for a WordPress plugin view asset', () => {
    expect(isOmekaHtml(wordpressPluginHtml)).toBe(false)
  })

  it('should return false for other software', () => {
    expect(isOmekaHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isOmekaHtml('')).toBe(false)
  })
})

describe('getOmekaPage', () => {
  it('should return the root of a site at the origin', () => {
    const expected: OmekaPage = { kind: 'page', rootUrl: 'https://example.com' }

    expect(getOmekaPage('https://example.com/', omekaHtml)).toEqual(expected)
  })

  it('should return the root of a site under a sub-path', () => {
    const expected: OmekaPage = { kind: 'page', rootUrl: 'https://example.com/biblioteca' }

    expect(getOmekaPage('https://example.com/biblioteca/', omekaSubPathHtml)).toEqual(expected)
  })

  it('should return the root named by an absolute asset URL', () => {
    const expected: OmekaPage = { kind: 'page', rootUrl: 'https://example.com' }

    expect(getOmekaPage('https://example.com/exhibits', omekaAbsoluteHtml)).toEqual(expected)
  })

  it('should return the root named by a core script asset', () => {
    const expected: OmekaPage = { kind: 'page', rootUrl: 'https://example.com' }

    expect(getOmekaPage('https://example.com/items/show/1000', omekaCoreHtml)).toEqual(expected)
  })

  it('should return the query of a tag browse page', () => {
    const expected: OmekaPage = {
      kind: 'browse',
      rootUrl: 'https://example.com/biblioteca',
      query: 'tags=poes%C3%ADa',
    }

    expect(
      getOmekaPage(
        'https://example.com/biblioteca/items/browse?tags=poes%C3%ADa',
        omekaSubPathHtml,
      ),
    ).toEqual(expected)
  })

  it('should return the query of a collection browse page', () => {
    const expected: OmekaPage = {
      kind: 'browse',
      rootUrl: 'https://example.com',
      query: 'collection=2',
    }

    expect(getOmekaPage('https://example.com/items/browse?collection=2', omekaHtml)).toEqual(
      expected,
    )
  })

  it('should drop the page and the search button from the query', () => {
    const value =
      'https://example.com/items/browse?advanced%5B0%5D%5Belement_id%5D=50&advanced%5B0%5D%5Btype%5D=contains&advanced%5B0%5D%5Bterms%5D=letter&submit_search=Search&page=2'
    const expected: OmekaPage = {
      kind: 'browse',
      rootUrl: 'https://example.com',
      query:
        'advanced%5B0%5D%5Belement_id%5D=50&advanced%5B0%5D%5Btype%5D=contains&advanced%5B0%5D%5Bterms%5D=letter',
    }

    expect(getOmekaPage(value, omekaHtml)).toEqual(expected)
  })

  it('should keep the sort of a browse page', () => {
    const value =
      'https://example.com/items/browse?tags=Blacksburg&sort_field=Dublin+Core%2CTitle&page=2'
    const expected: OmekaPage = {
      kind: 'browse',
      rootUrl: 'https://example.com',
      query: 'tags=Blacksburg&sort_field=Dublin+Core%2CTitle',
    }

    expect(getOmekaPage(value, omekaHtml)).toEqual(expected)
  })

  it('should return the query of the short items route', () => {
    const expected: OmekaPage = {
      kind: 'browse',
      rootUrl: 'https://example.com',
      query: 'tags=1931',
    }

    expect(getOmekaPage('https://example.com/items?tags=1931', omekaHtml)).toEqual(expected)
  })

  it('should return a page for a browse page with no filter', () => {
    const expected: OmekaPage = { kind: 'page', rootUrl: 'https://example.com' }

    expect(getOmekaPage('https://example.com/items/browse?page=3', omekaHtml)).toEqual(expected)
  })

  it('should return a page for a filtered page outside the items browse', () => {
    const expected: OmekaPage = { kind: 'page', rootUrl: 'https://example.com' }

    expect(getOmekaPage('https://example.com/collections/browse?tags=1931', omekaHtml)).toEqual(
      expected,
    )
  })
})

describe('omekaHandler', () => {
  describe('match', () => {
    it('should match an Omeka page', () => {
      expect(omekaHandler.match('https://example.com/', omekaHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(omekaHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match a WordPress plugin view asset', () => {
      expect(omekaHandler.match('https://shop.example/', wordpressPluginHtml)).toBe(false)
    })

    it('should not match other software', () => {
      expect(omekaHandler.match('https://example.com/', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the filtered items feeds for a browse page', () => {
      const value = 'https://example.com/biblioteca/items/browse?tags=poes%C3%ADa'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/biblioteca/items/browse?tags=poes%C3%ADa&output=rss2',
          hint: { key: 'omeka:filtered-items', label: 'Filtered items', format: 'rss' },
        },
        {
          uri: 'https://example.com/biblioteca/items/browse?tags=poes%C3%ADa&output=atom',
          hint: { key: 'omeka:filtered-items', label: 'Filtered items', format: 'atom' },
        },
      ]

      expect(omekaHandler.resolve(value, omekaSubPathHtml)).toEqual(expected)
    })

    it('should return the items feeds for any other page', () => {
      const value = 'https://example.com/biblioteca/exhibits/show/poesia'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/biblioteca/items/browse?output=rss2',
          hint: { key: 'omeka:items', label: 'Items', format: 'rss' },
        },
        {
          uri: 'https://example.com/biblioteca/items/browse?output=atom',
          hint: { key: 'omeka:items', label: 'Items', format: 'atom' },
        },
      ]

      expect(omekaHandler.resolve(value, omekaSubPathHtml)).toEqual(expected)
    })
  })
})
