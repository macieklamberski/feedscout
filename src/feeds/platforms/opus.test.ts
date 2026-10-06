import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getOpusPage, isOpusHtml, type OpusPage, opusHandler } from './opus.js'

const opusHtml = `
  <head>
    <script
      type="text/javascript"
      src="/layouts/opus4/js/frontdoorutil.js"
    ></script>
  </head>
`
const opusSubPathHtml = `
  <head>
    <script
      type="text/javascript"
      src="/opus4/layouts/opus4-zwi2/js/frontdoorutil.js"
    ></script>
  </head>
`
const opusEmptyFacetHtml = `
  <head>
    <link
      href="https://example.com/solrsearch/index/search/searchtype/simple/query/%2A%3A%2A/yearfq//doctypefq/article/start/0/rows/10"
      rel="canonical"
    />
    <link
      href="https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/yearfq//doctypefq/article"
      rel="alternate"
      type="application/rss+xml"
    />
    <script
      type="text/javascript"
      src="/layouts/opus4/js/frontdoorutil.js"
    ></script>
  </head>
`
const opusSiteFeedHtml = `
  <head>
    <link
      href="https://example.com/rss/index/index"
      rel="alternate"
      type="application/rss+xml"
    />
    <script
      type="text/javascript"
      src="/layouts/opus4/js/frontdoorutil.js"
    ></script>
  </head>
`
const opusMalformedLinkHtml = `
  <head>
    <link
      href="http://["
      rel="alternate"
      type="application/rss+xml"
    />
    <script
      type="text/javascript"
      src="/layouts/opus4/js/frontdoorutil.js"
    ></script>
  </head>
`
const opusOtherHostHtml = `
  <head>
    <link
      href="https://other.example.com/rss/index/index/searchtype/collection/id/112"
      rel="alternate"
      type="application/rss+xml"
    />
    <script
      type="text/javascript"
      src="/layouts/opus4/js/frontdoorutil.js"
    ></script>
  </head>
`
const otherHtml = `
  <head>
    <link
      href="/layouts/default/css/style.css"
      rel="stylesheet"
    >
  </head>
`

describe('isOpusHtml', () => {
  it('should return true for the default layout script', () => {
    expect(isOpusHtml(opusHtml)).toBe(true)
  })

  it('should return true for a custom layout script', () => {
    expect(isOpusHtml(opusSubPathHtml)).toBe(true)
  })

  it('should return false for other software', () => {
    expect(isOpusHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isOpusHtml('')).toBe(false)
  })
})

describe('getOpusPage', () => {
  it('should return a collection page', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/112'
    const expected: OpusPage = {
      kind: 'collection',
      feedUrl: 'https://example.com/rss/index/index/searchtype/collection/id/112',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should return a collection page under a sub-path', () => {
    const value = 'https://example.com/opus4/solrsearch/index/search/searchtype/collection/id/55'
    const expected: OpusPage = {
      kind: 'collection',
      feedUrl: 'https://example.com/opus4/rss/index/index/searchtype/collection/id/55',
    }

    expect(getOpusPage(value, opusSubPathHtml)).toEqual(expected)
  })

  it('should return a facet search page with the query spelled as OPUS spells it', () => {
    const value =
      'https://example.com/solrsearch/index/search/searchtype/simple/query/*:*/yearfq/2011'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl: 'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/yearfq/2011',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should keep an already encoded query', () => {
    const value =
      'https://example.com/solrsearch/index/search/searchtype/simple/query/%2A%3A%2A/doctypefq/masterthesis'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl:
        'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/doctypefq/masterthesis',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should drop the paging and sorting parameters', () => {
    const value =
      'https://example.com/solrsearch/index/search/searchtype/simple/query/%2A%3A%2A/yearfq/2011/start/0/rows/10/author_facetfq/Doe%2C+J./sortfield/year/sortorder/desc'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl:
        'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/yearfq/2011/author_facetfq/Doe%2C+J.',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should spell a space in the query as a plus', () => {
    const value =
      'https://example.com/solrsearch/index/search/searchtype/simple/query/data%20mining'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl: 'https://example.com/rss/index/index/searchtype/simple/query/data+mining',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should encode non-ASCII characters and quotes in the query', () => {
    const value =
      'https://example.com/solrsearch/index/search/searchtype/simple/query/K%C3%BCnstliche+Intelligenz%22'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl:
        'https://example.com/rss/index/index/searchtype/simple/query/K%C3%BCnstliche+Intelligenz%22',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should keep a facet without a value', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/simple/query/*:*/yearfq/'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl: 'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/yearfq/',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should keep an empty facet between two others', () => {
    const value =
      'https://example.com/solrsearch/index/search/searchtype/simple/query/*:*/yearfq//doctypefq/article/start/0/rows/10'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl:
        'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/yearfq//doctypefq/article',
    }

    expect(getOpusPage(value, opusHtml)).toEqual(expected)
  })

  it('should return the feed the page links', () => {
    const value =
      'https://example.com/solrsearch/index/search/searchtype/simple/query/*:*/yearfq/doctypefq/article/start/0/rows/10'
    const expected: OpusPage = {
      kind: 'search',
      feedUrl:
        'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/yearfq//doctypefq/article',
    }

    expect(getOpusPage(value, opusEmptyFacetHtml)).toEqual(expected)
  })

  it('should build the feed when the page links only the site feed', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/112'
    const expected: OpusPage = {
      kind: 'collection',
      feedUrl: 'https://example.com/rss/index/index/searchtype/collection/id/112',
    }

    expect(getOpusPage(value, opusSiteFeedHtml)).toEqual(expected)
  })

  it('should build the feed when the page links a feed on another host', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/112'
    const expected: OpusPage = {
      kind: 'collection',
      feedUrl: 'https://example.com/rss/index/index/searchtype/collection/id/112',
    }

    expect(getOpusPage(value, opusOtherHostHtml)).toEqual(expected)
  })

  it('should build the feed when the page links a malformed url', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/112'
    const expected: OpusPage = {
      kind: 'collection',
      feedUrl: 'https://example.com/rss/index/index/searchtype/collection/id/112',
    }

    expect(getOpusPage(value, opusMalformedLinkHtml)).toEqual(expected)
  })

  it('should return undefined for a collection id that is not a number', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/abc'

    expect(getOpusPage(value, opusHtml)).toBeUndefined()
  })

  it('should return undefined for a search without a query', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/simple'

    expect(getOpusPage(value, opusHtml)).toBeUndefined()
  })

  it('should return undefined for another search type', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/series/id/3'

    expect(getOpusPage(value, opusHtml)).toBeUndefined()
  })

  it('should return undefined for a malformed parameter', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/simple/query/%E0%A4%A'

    expect(getOpusPage(value, opusHtml)).toBeUndefined()
  })

  it('should return undefined for a page outside the search', () => {
    expect(getOpusPage('https://example.com/home', opusHtml)).toBeUndefined()
  })

  it('should return undefined for a page outside the install root', () => {
    const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/55'

    expect(getOpusPage(value, opusSubPathHtml)).toBeUndefined()
  })
})

describe('opusHandler', () => {
  describe('match', () => {
    it('should match an OPUS collection page', () => {
      const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/112'

      expect(opusHandler.match(value, opusHtml)).toBe(true)
    })

    it('should not match an OPUS page outside the search', () => {
      expect(opusHandler.match('https://example.com/home', opusHtml)).toBe(false)
    })

    it('should not match without content', () => {
      const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/112'

      expect(opusHandler.match(value)).toBe(false)
    })

    it('should not match other software', () => {
      const value = 'https://example.com/solrsearch/index/search/searchtype/collection/id/112'

      expect(opusHandler.match(value, otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the collection feed for a collection page', () => {
      const value = 'https://example.com/opus4/solrsearch/index/search/searchtype/collection/id/55'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/opus4/rss/index/index/searchtype/collection/id/55',
          hint: { key: 'opus:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(opusHandler.resolve(value, opusSubPathHtml)).toEqual(expected)
    })

    it('should return the search feed for a search page', () => {
      const value =
        'https://example.com/solrsearch/index/search/searchtype/simple/query/*:*/doctypefq/article'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/doctypefq/article',
          hint: { key: 'opus:search', label: 'Search results', format: 'rss' },
        },
      ]

      expect(opusHandler.resolve(value, opusHtml)).toEqual(expected)
    })

    it('should return only the linked feed when the page url lost an empty facet', () => {
      const value =
        'https://example.com/solrsearch/index/search/searchtype/simple/query/*:*/yearfq/doctypefq/article/start/0/rows/10/sortfield/year/sortorder/desc'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/rss/index/index/searchtype/simple/query/%2A%3A%2A/yearfq//doctypefq/article',
          hint: { key: 'opus:search', label: 'Search results', format: 'rss' },
        },
      ]

      expect(opusHandler.resolve(value, opusEmptyFacetHtml)).toEqual(expected)
    })

    it('should return nothing for a page outside the search', () => {
      expect(opusHandler.resolve('https://example.com/home', opusHtml)).toEqual([])
    })
  })
})
