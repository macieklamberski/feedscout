import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  getOpencartJournalPage,
  isOpencartJournalHtml,
  type OpencartJournalPage,
  opencartJournalHandler,
} from './opencartJournal.js'

const journal3Html = `
  <html
    dir="ltr"
    lang="en"
    class="desktop oc30 is-guest store-0 skin-1 route-common-home layout-1"
    data-jv="3.0.44"
    data-ov="3.0.3.2"
  >
    <head>
      <base href="https://example.com/" />
      <link href="catalog/view/theme/journal3/stylesheet/style.css?v=3.0.44" rel="stylesheet">
    </head>
  </html>
`
const journal2Html = `
  <html
    dir="ltr"
    lang="en"
    class="webkit chrome journal-desktop is-guest skin-5 home-page route-common-home oc2"
    data-j2v="2.16.8.1"
  >
    <head>
      <base href="https://example.com/" />
    </head>
  </html>
`
const subPathHtml = `
  <html
    lang="en"
    data-jv="3.1.4"
    data-ov="3.0.3.6"
  >
    <head>
      <base href="https://example.com/shop/" />
    </head>
  </html>
`
const noBaseHtml = `
  <html
    lang="en"
    data-jv="3.0.37"
    data-ov="3.0.2.0"
  >
    <head></head>
  </html>
`
const emptyBaseHtml = `
  <html data-j2v="2.7.6">
    <head><base href="" /></head>
  </html>
`
const unparsableBaseHtml = `
  <html
    lang="en"
    data-jv="3.0.37"
    data-ov="3.0.2.0"
  >
    <head>
      <base href="http://[" />
    </head>
  </html>
`
const formFieldHtml = `
  <html lang="en">
    <body>
      <input
        name="username"
        type="text"
        data-jv="required"
      >
    </body>
  </html>
`
const defaultThemeHtml = `
  <html
    dir="ltr"
    lang="en"
  >
    <head>
      <base href="https://example.com/" />
      <link href="catalog/view/theme/default/stylesheet/stylesheet.css" rel="stylesheet">
    </head>
  </html>
`

describe('isOpencartJournalHtml', () => {
  it('should return true for the Journal 3 version attribute', () => {
    expect(isOpencartJournalHtml(journal3Html)).toBe(true)
  })

  it('should return true for the Journal 2 version attribute', () => {
    expect(isOpencartJournalHtml(journal2Html)).toBe(true)
  })

  it('should return false for the version attribute on a form field', () => {
    expect(isOpencartJournalHtml(formFieldHtml)).toBe(false)
  })

  it('should return false for the default OpenCart theme', () => {
    expect(isOpencartJournalHtml(defaultThemeHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isOpencartJournalHtml('')).toBe(false)
  })
})

describe('getOpencartJournalPage', () => {
  it('should return the directory of the page for an empty base', () => {
    const value = 'https://example.com/shop/index.php?route=product/product&product_id=1'
    const expected: OpencartJournalPage = {
      kind: 'store',
      storeUrl: 'https://example.com/shop/',
      version: 'journal2',
    }

    expect(getOpencartJournalPage(value, emptyBaseHtml)).toEqual(expected)
  })

  it('should return the store of a Journal 3 page', () => {
    const expected: OpencartJournalPage = {
      kind: 'store',
      storeUrl: 'https://example.com/',
      version: 'journal3',
    }

    expect(getOpencartJournalPage('https://example.com/', journal3Html)).toEqual(expected)
  })

  it('should return the store of a Journal 2 page', () => {
    const expected: OpencartJournalPage = {
      kind: 'store',
      storeUrl: 'https://example.com/',
      version: 'journal2',
    }

    expect(getOpencartJournalPage('https://example.com/', journal2Html)).toEqual(expected)
  })

  it('should return the base of a store under a sub-path', () => {
    const expected: OpencartJournalPage = {
      kind: 'store',
      storeUrl: 'https://example.com/shop/',
      version: 'journal3',
    }

    expect(getOpencartJournalPage('https://example.com/shop/', subPathHtml)).toEqual(expected)
  })

  it('should return the origin for a page without a base', () => {
    const expected: OpencartJournalPage = {
      kind: 'store',
      storeUrl: 'https://example.com/',
      version: 'journal3',
    }

    expect(getOpencartJournalPage('https://example.com/blog', noBaseHtml)).toEqual(expected)
  })

  it('should return the origin for an unparsable base', () => {
    const expected: OpencartJournalPage = {
      kind: 'store',
      storeUrl: 'https://example.com/',
      version: 'journal3',
    }

    expect(getOpencartJournalPage('https://example.com/blog', unparsableBaseHtml)).toEqual(expected)
  })

  it('should return undefined for the default OpenCart theme', () => {
    expect(getOpencartJournalPage('https://example.com/', defaultThemeHtml)).toBeUndefined()
  })

  it('should return undefined without content', () => {
    expect(getOpencartJournalPage('https://example.com/', undefined)).toBeUndefined()
  })
})

describe('opencartJournalHandler', () => {
  describe('match', () => {
    it('should match a Journal store page', () => {
      expect(opencartJournalHandler.match('https://example.com/', journal3Html)).toBe(true)
    })

    it('should not match without content', () => {
      expect(opencartJournalHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match the default OpenCart theme', () => {
      expect(opencartJournalHandler.match('https://example.com/', defaultThemeHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array without content', () => {
      expect(opencartJournalHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the blog feed of a Journal 3 store', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: [
            'https://example.com/shop/index.php?route=journal3/blog/feed',
            'https://example.com/shop/index.php?route=journal3/blog.feed',
          ],
          hint: { key: 'opencart-journal:blog', label: 'Blog', format: 'rss' },
        },
      ]

      expect(opencartJournalHandler.resolve('https://example.com/shop/', subPathHtml)).toEqual(
        expected,
      )
    })

    it('should return the blog feed of a Journal 2 store', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/index.php?route=journal2/blog/feed',
          hint: { key: 'opencart-journal:blog', label: 'Blog', format: 'rss' },
        },
      ]

      expect(opencartJournalHandler.resolve('https://example.com/', journal2Html)).toEqual(expected)
    })
  })
})
