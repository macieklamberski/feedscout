import { describe, expect, it } from 'bun:test'
import { isKohaHtml, type KohaUrl, kohaHandler, parseKohaUrl } from './koha.js'

const kohaHtml = `
  <head>
    <meta name="generator" content="Koha 22.0522000" />
    <link rel="shortcut icon" href="/opac-tmpl/bootstrap/images/favicon.ico" type="image/x-icon" />
    <link href="/opac-tmpl/bootstrap/css/opac_22.0522000.css" type="text/css" rel="stylesheet">
  </head>
`
const otherHtml = `
  <head>
    <meta name="generator" content="WordPress 6.6.2" />
    <link rel="stylesheet" href="/wp-content/themes/twentytwentyfour/style.css" />
  </head>
`

describe('isKohaHtml', () => {
  it('should return true for the OPAC template asset path', () => {
    expect(isKohaHtml(kohaHtml)).toBe(true)
  })

  it('should return false for other software', () => {
    expect(isKohaHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isKohaHtml('')).toBe(false)
  })
})

describe('parseKohaUrl', () => {
  it('should return the query of a search page', () => {
    const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-search.pl?q=agua'
    const expected: KohaUrl = { kind: 'search', root: '', params: 'q=agua' }

    expect(parseKohaUrl(value)).toEqual(expected)
  })

  it('should drop the count, paging, sort and format of a search page', () => {
    const value =
      'https://opac.iub.edu.bd/cgi-bin/koha/opac-search.pl?idx=kw&q=water&count=20&offset=20&sort_by=title_az&format=rss'
    const expected: KohaUrl = { kind: 'search', root: '', params: 'idx=kw&q=water' }

    expect(parseKohaUrl(value)).toEqual(expected)
  })

  it('should return the limits of a search page without a query', () => {
    const value =
      'https://biblioteca.termcat.cat/cgi-bin/koha/opac-search.pl?limit=su-to%3AInternet&limit=au%3ATERMCAT'
    const expected: KohaUrl = {
      kind: 'search',
      root: '',
      params: 'limit=su-to%3AInternet&limit=au%3ATERMCAT',
    }

    expect(parseKohaUrl(value)).toEqual(expected)
  })

  it('should return the root of an install printed with a doubled slash', () => {
    const value = 'https://opac.ulab.edu.bd//cgi-bin/koha/opac-search.pl?q=bangladesh'
    const expected: KohaUrl = { kind: 'search', root: '/', params: 'q=bangladesh' }

    expect(parseKohaUrl(value)).toEqual(expected)
  })

  it('should return the shelf number of a list page', () => {
    const value =
      'https://library-search.nics.gov.uk/cgi-bin/koha/opac-shelves.pl?op=view&shelfnumber=309'
    const expected: KohaUrl = { kind: 'list', root: '', shelfNumber: '309' }

    expect(parseKohaUrl(value)).toEqual(expected)
  })

  it('should return the comments page', () => {
    const value = 'https://opac.northsouth.edu/cgi-bin/koha/opac-showreviews.pl'
    const expected: KohaUrl = { kind: 'comments', root: '' }

    expect(parseKohaUrl(value)).toEqual(expected)
  })

  it('should return undefined for a search page without a query', () => {
    const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-search.pl?q=&idx=kw'

    expect(parseKohaUrl(value)).toBeUndefined()
  })

  it('should return undefined for the list of public lists', () => {
    const value = 'https://library-search.nics.gov.uk/cgi-bin/koha/opac-shelves.pl?op=list&public=1'

    expect(parseKohaUrl(value)).toBeUndefined()
  })

  it('should return undefined for a list page with a non-numeric shelf number', () => {
    const value =
      'https://library-search.nics.gov.uk/cgi-bin/koha/opac-shelves.pl?op=view&shelfnumber=abc'

    expect(parseKohaUrl(value)).toBeUndefined()
  })

  it('should return undefined for the OPAC home page', () => {
    const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-main.pl'

    expect(parseKohaUrl(value)).toBeUndefined()
  })

  it('should return undefined for the news feed', () => {
    const value = 'https://library.imar.ro/cgi-bin/koha/opac-news-rss.pl'

    expect(parseKohaUrl(value)).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseKohaUrl('not-a-url')).toBeUndefined()
  })
})

describe('kohaHandler', () => {
  describe('match', () => {
    it('should match a Koha search page', () => {
      const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-search.pl?q=agua'

      expect(kohaHandler.match(value, kohaHtml)).toBe(true)
    })

    it('should not match without content', () => {
      const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-search.pl?q=agua'

      expect(kohaHandler.match(value)).toBe(false)
    })

    it('should not match other software', () => {
      const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-search.pl?q=agua'

      expect(kohaHandler.match(value, otherHtml)).toBe(false)
    })

    it('should not match a Koha page that names no feed', () => {
      const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-main.pl'

      expect(kohaHandler.match(value, kohaHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a Koha page that names no feed', () => {
      const value = 'https://biblioteca.unach.edu.ec/cgi-bin/koha/opac-main.pl'

      expect(kohaHandler.resolve(value)).toEqual([])
    })

    it('should return the search feed for a search page', () => {
      const value =
        'https://opac.iub.edu.bd/cgi-bin/koha/opac-search.pl?idx=kw&q=water&sort_by=title_az'
      const expected = [
        {
          uri: [
            'https://opac.iub.edu.bd/cgi-bin/koha/opac-search.pl?idx=kw&q=water&count=50&sort_by=acqdate_dsc&format=rss',
            'https://opac.iub.edu.bd/cgi-bin/koha/opac-search.pl?idx=kw&q=water&count=50&sort_by=acqdate_dsc&format=rss2',
          ],
          hint: { key: 'koha:search', label: 'Search' },
        },
      ]

      expect(kohaHandler.resolve(value)).toEqual(expected)
    })

    it('should return the list feed for a list page', () => {
      const value =
        'https://library-search.nics.gov.uk/cgi-bin/koha/opac-shelves.pl?op=view&shelfnumber=309'
      const expected = [
        {
          uri: 'https://library-search.nics.gov.uk/cgi-bin/koha/opac-shelves.pl?rss=1&op=view&shelfnumber=309',
          hint: { key: 'koha:list', label: 'List' },
        },
      ]

      expect(kohaHandler.resolve(value)).toEqual(expected)
    })

    it('should return the comments feed for the comments page', () => {
      const value = 'https://opac.northsouth.edu/cgi-bin/koha/opac-showreviews.pl'
      const expected = [
        {
          uri: 'https://opac.northsouth.edu/cgi-bin/koha/opac-showreviews.pl?format=rss',
          hint: { key: 'koha:comments', label: 'Recent comments' },
        },
      ]

      expect(kohaHandler.resolve(value)).toEqual(expected)
    })
  })
})
