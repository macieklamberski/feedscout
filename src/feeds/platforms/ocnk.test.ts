import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isOcnkHtml, type OcnkUrl, ocnkHandler, parseOcnkUrl } from './ocnk.js'

const pcScriptHtml = `
  <script
    type="text/javascript"
    src="https://www.example.com/res/css172/js/ocnk.js?1401845513"
  ></script>
`
const responsiveScriptHtml = `
  <script src="https://www.example.com/res/touch003/js/pack/ocnk-min.js?1613362007"></script>
`

describe('isOcnkHtml', () => {
  it('should return true for the PC template cart script', () => {
    expect(isOcnkHtml(pcScriptHtml)).toBe(true)
  })

  it('should return true for the responsive template cart script', () => {
    expect(isOcnkHtml(responsiveScriptHtml)).toBe(true)
  })

  it('should return false for another script under /res/', () => {
    const value = '<script src="https://www.example.com/res/touch003/js/jquery.min.js"></script>'

    expect(isOcnkHtml(value)).toBe(false)
  })

  it('should return false for the cart script outside the root /res/ folder', () => {
    const value = '<script src="/shop/res/touch003/js/pack/ocnk-min.js"></script>'

    expect(isOcnkHtml(value)).toBe(false)
  })

  it('should return false for a file that only starts with the cart script name', () => {
    const value = '<script src="https://www.example.com/res/css172/js/ocnk.json"></script>'

    expect(isOcnkHtml(value)).toBe(false)
  })
})

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

  it('should return a custom domain for another host', () => {
    const expected: OcnkUrl = { kind: 'customDomain' }

    expect(parseOcnkUrl('https://www.example.com/')).toEqual(expected)
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

    it('should match a custom domain carrying the cart script', () => {
      expect(ocnkHandler.match('https://www.example.com/', responsiveScriptHtml)).toBe(true)
    })

    it('should not match the www service host carrying the cart script', () => {
      expect(ocnkHandler.match('https://www.ocnk.net/', responsiveScriptHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a service host', () => {
      expect(ocnkHandler.resolve('https://www.ocnk.net/')).toEqual([])
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

    it('should return the products feed on the origin for a custom domain', () => {
      const value = 'https://www.example.com/product/24'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/rss/rss.php',
          hint: { key: 'ocnk:products', label: 'Products', format: 'rdf' },
        },
      ]

      expect(ocnkHandler.resolve(value, pcScriptHtml)).toEqual(expected)
    })

    it('should keep the http origin for a custom domain', () => {
      const value = 'http://www.example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.example.com/rss/rss.php',
          hint: { key: 'ocnk:products', label: 'Products', format: 'rdf' },
        },
      ]

      expect(ocnkHandler.resolve(value, pcScriptHtml)).toEqual(expected)
    })
  })
})
