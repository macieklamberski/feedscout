import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type OcnkUrl, ocnkHandler, parseOcnkUrl } from './ocnk.js'

describe('parseOcnkUrl', () => {
  it('should return the shop for a shop subdomain', () => {
    const expected: OcnkUrl = { kind: 'shop', shop: 'example' }

    expect(parseOcnkUrl('https://example.ocnk.net/')).toEqual(expected)
  })

  it('should return the shop for a product page', () => {
    const expected: OcnkUrl = { kind: 'shop', shop: 'example' }

    expect(parseOcnkUrl('https://example.ocnk.net/product/24')).toEqual(expected)
  })

  const serviceHosts: Array<string> = ['admin', 'api', 'app', 'auth', 'blog', 'www']

  it.each(serviceHosts)('should return undefined for the %s service host', (host) => {
    expect(parseOcnkUrl(`https://${host}.ocnk.net/`)).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseOcnkUrl('https://a.example.ocnk.net/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseOcnkUrl('https://ocnk.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseOcnkUrl('https://example.com/')).toBeUndefined()
  })
})

describe('ocnkHandler', () => {
  describe('match', () => {
    it('should match a shop subdomain', () => {
      expect(ocnkHandler.match('https://example.ocnk.net/')).toBe(true)
    })

    it('should not match another host', () => {
      expect(ocnkHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Ochanoko Net', () => {
      expect(ocnkHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the products feed for a shop', () => {
      const value = 'https://example.ocnk.net/product/24'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ocnk.net/rss/rss.php',
          hint: { key: 'ocnk:products', label: 'Products', format: 'rdf' },
        },
      ]

      expect(ocnkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feed for a shop page on http', () => {
      const value = 'http://example.ocnk.net/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ocnk.net/rss/rss.php',
          hint: { key: 'ocnk:products', label: 'Products', format: 'rdf' },
        },
      ]

      expect(ocnkHandler.resolve(value)).toEqual(expected)
    })
  })
})
