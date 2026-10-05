import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  type BigCartelUrl,
  bigCartelHandler,
  isBigCartelHeaders,
  isBigCartelHtml,
  parseBigCartelUrl,
} from './bigCartel.js'

const storeHtml = `
  <link
    href="/theme_stylesheets/217471873/1704246899/theme.css"
    media="screen"
    rel="stylesheet"
    type="text/css"
  >
`
const storeHeaders = new Headers({ 'x-frame-options': 'ALLOW-FROM https://my.bigcartel.com' })

describe('isBigCartelHtml', () => {
  it('should return true for the theme stylesheet', () => {
    expect(isBigCartelHtml(storeHtml)).toBe(true)
  })

  it('should return true for the theme stylesheet with a capitalised rel', () => {
    const value =
      '<link href="/theme_stylesheets/93065233/1753660907/theme.css" media="screen" rel="Stylesheet" type="text/css" />'

    expect(isBigCartelHtml(value)).toBe(true)
  })

  it('should return false for another stylesheet', () => {
    const value = '<link href="/assets/theme.css" rel="stylesheet">'

    expect(isBigCartelHtml(value)).toBe(false)
  })

  it('should return false for the theme stylesheet path on another element', () => {
    const value =
      '<a href="/theme_stylesheets/217471873/1704246899/theme.css" rel="stylesheet">CSS</a>'

    expect(isBigCartelHtml(value)).toBe(false)
  })

  it('should return false for the theme stylesheet path on another host', () => {
    const value =
      '<link href="https://cdn.example.com/theme_stylesheets/217471873/1704246899/theme.css" rel="stylesheet">'

    expect(isBigCartelHtml(value)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isBigCartelHtml('')).toBe(false)
  })
})

describe('isBigCartelHeaders', () => {
  it('should return true for frame options allowing the Big Cartel admin', () => {
    expect(isBigCartelHeaders(storeHeaders)).toBe(true)
  })

  it('should return false for other frame options', () => {
    const value = new Headers({ 'x-frame-options': 'SAMEORIGIN' })

    expect(isBigCartelHeaders(value)).toBe(false)
  })

  it('should return false without frame options', () => {
    expect(isBigCartelHeaders(new Headers())).toBe(false)
  })
})

describe('parseBigCartelUrl', () => {
  it('should return the store for a store subdomain', () => {
    const expected: BigCartelUrl = { kind: 'store' }

    expect(parseBigCartelUrl('https://alice.bigcartel.com/product/a-print')).toEqual(expected)
  })

  const excludedUrls = [
    'https://bigcartel.com/',
    'https://www.bigcartel.com/',
    'https://my.bigcartel.com/dashboard',
    'https://developers.bigcartel.com/',
    'https://assets.bigcartel.com/theme_files/1/theme.css',
    'https://foo.alice.bigcartel.com/',
  ]

  it.each(excludedUrls)('should return undefined for %s', (url) => {
    expect(parseBigCartelUrl(url)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBigCartelUrl('https://example.com/')).toBeUndefined()
  })
})

describe('bigCartelHandler', () => {
  describe('match', () => {
    it('should match a store subdomain without content', () => {
      expect(bigCartelHandler.match('https://alice.bigcartel.com/')).toBe(true)
    })

    it('should match a store on its own domain by the theme stylesheet', () => {
      expect(bigCartelHandler.match('https://example.com/', storeHtml)).toBe(true)
    })

    it('should match a store on its own domain by the frame options', () => {
      expect(bigCartelHandler.match('https://example.com/', '', storeHeaders)).toBe(true)
    })

    it('should not match a Big Cartel service host carrying the markers', () => {
      expect(bigCartelHandler.match('https://www.bigcartel.com/', storeHtml, storeHeaders)).toBe(
        false,
      )
    })

    it('should not match another site', () => {
      expect(bigCartelHandler.match('https://example.com/', '<p>Shop</p>')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the products feed for a store subdomain', () => {
      const value = 'https://alice.bigcartel.com/product/a-print'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bigcartel.com/products.rss',
          hint: { key: 'big-cartel:products', label: 'Products' },
        },
      ]

      expect(bigCartelHandler.resolve(value)).toEqual(expected)
    })

    it('should return the products feed for a store on its own domain', () => {
      const value = 'https://shop.example.com/category/prints'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shop.example.com/products.rss',
          hint: { key: 'big-cartel:products', label: 'Products' },
        },
      ]

      expect(bigCartelHandler.resolve(value)).toEqual(expected)
    })
  })
})
