import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ColorMeShopUrl, colorMeShopHandler, parseColorMeShopUrl } from './colorMeShop.js'

const shopCookies = [
  'colorme_ATID=6cd34b6a-6587-4629-9258-7c27aca1e204; Path=/; Expires=Mon, 08 Nov 2027 15:39:06 GMT; Max-Age=34560000; HttpOnly',
  'colorme_PHPSESSID=4ecbfa614b11dd6e3de271c5c1a6e28b; Path=/',
  'colorme_reference_token=092b30a4619f42549db83e79721c8505; Expires=Mon, 04 Oct 2027 15:39:06 GMT; Max-Age=31536000',
]

describe('parseColorMeShopUrl', () => {
  it('should return the shop for a shop subdomain', () => {
    const expected: ColorMeShopUrl = { kind: 'shop' }

    expect(parseColorMeShopUrl('https://example.shop-pro.jp/')).toEqual(expected)
  })

  it('should return the shop for a product page', () => {
    const expected: ColorMeShopUrl = { kind: 'shop' }

    expect(parseColorMeShopUrl('https://example.shop-pro.jp/?pid=193633107')).toEqual(expected)
  })

  it('should return undefined for a blog on a nested subdomain', () => {
    expect(parseColorMeShopUrl('http://blog.example.shop-pro.jp/')).toBeUndefined()
  })

  it('should return undefined for the www host', () => {
    expect(parseColorMeShopUrl('https://www.shop-pro.jp/')).toBeUndefined()
  })

  const numberedHostValues: Array<string> = ['acclog001', 'img15']

  it.each(numberedHostValues)('should return undefined for the numbered %s host', (host) => {
    expect(parseColorMeShopUrl(`https://${host}.shop-pro.jp/`)).toBeUndefined()
  })

  it('should return the shop for a label that only contains a numbered host name', () => {
    const expected: ColorMeShopUrl = { kind: 'shop' }

    expect(parseColorMeShopUrl('https://myimg2.shop-pro.jp/')).toEqual(expected)
    expect(parseColorMeShopUrl('https://img2shop.shop-pro.jp/')).toEqual(expected)
  })

  it('should return undefined for the apex domain', () => {
    expect(parseColorMeShopUrl('https://shop-pro.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseColorMeShopUrl('https://example.com/')).toBeUndefined()
  })
})

describe('colorMeShopHandler', () => {
  describe('match', () => {
    it('should match a shop subdomain without headers', () => {
      expect(colorMeShopHandler.match('https://example.shop-pro.jp/')).toBe(true)
    })

    it('should match a shop on its own domain by the session cookie', () => {
      const headers = new Headers()

      for (const cookie of shopCookies) {
        headers.append('set-cookie', cookie)
      }

      expect(colorMeShopHandler.match('https://example.com/', '', headers)).toBe(true)
    })

    it('should not match a page with a plain PHP session cookie', () => {
      const headers = new Headers({
        'set-cookie': 'PHPSESSID=4ecbfa614b11dd6e3de271c5c1a6e28b; Path=/',
      })

      expect(colorMeShopHandler.match('https://example.com/', '', headers)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS 1.0 and Atom feeds for a shop', () => {
      const value = 'https://example.shop-pro.jp/?pid=193633107'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.shop-pro.jp/?mode=rss',
          hint: { key: 'color-me-shop:products', label: 'Products', format: 'rdf' },
        },
        {
          uri: 'https://example.shop-pro.jp/?mode=atom',
          hint: { key: 'color-me-shop:products', label: 'Products', format: 'atom' },
        },
      ]

      expect(colorMeShopHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http shop page', () => {
      const value = 'http://example.shop-pro.jp/?pid=193633107'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.shop-pro.jp/?mode=rss',
          hint: { key: 'color-me-shop:products', label: 'Products', format: 'rdf' },
        },
        {
          uri: 'http://example.shop-pro.jp/?mode=atom',
          hint: { key: 'color-me-shop:products', label: 'Products', format: 'atom' },
        },
      ]

      expect(colorMeShopHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds at the origin of a shop on its own domain', () => {
      const value = 'https://www.example.com/?mode=cate&cbid=2130010&csid=0'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.example.com/?mode=rss',
          hint: { key: 'color-me-shop:products', label: 'Products', format: 'rdf' },
        },
        {
          uri: 'https://www.example.com/?mode=atom',
          hint: { key: 'color-me-shop:products', label: 'Products', format: 'atom' },
        },
      ]

      expect(colorMeShopHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the products hint for an atom feed', () => {
      const value = 'https://example.shop-pro.jp/?mode=atom'
      const expected: DiscoverUriHint = {
        key: 'color-me-shop:products',
        label: 'Products',
        format: 'atom',
      }

      expect(colorMeShopHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a feed on a numbered host', () => {
      const value = 'https://img15.shop-pro.jp/?mode=rss'

      expect(colorMeShopHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a feed as itself', async () => {
      const value = 'http://example.shop-pro.jp/?mode=rss'
      const options = {
        ...defaultPlatformOptions,
        handlers: [colorMeShopHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.shop-pro.jp/?mode=rss',
          hint: { key: 'color-me-shop:products', label: 'Products', format: 'rdf' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
