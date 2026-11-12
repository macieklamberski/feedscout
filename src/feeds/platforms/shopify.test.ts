import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { isShopifyHeaders, parseShopifyUrl, type ShopifyUrl, shopifyHandler } from './shopify.js'

const shopifyHeaders = new Headers({ 'powered-by': 'Shopify' })

describe('isShopifyHeaders', () => {
  it('should return true for the powered-by header', () => {
    expect(isShopifyHeaders(shopifyHeaders)).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isShopifyHeaders(new Headers())).toBe(false)
    expect(isShopifyHeaders(new Headers({ 'x-powered-by': 'Express' }))).toBe(false)
  })
})

describe('parseShopifyUrl', () => {
  it('should return the blog for a blog page', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news' }

    expect(parseShopifyUrl('https://shop.example/blogs/news')).toEqual(expected)
  })

  it('should return the blog for an article page', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news' }

    expect(parseShopifyUrl('https://shop.example/blogs/news/first-post')).toEqual(expected)
  })

  it('should return the blog with its locale for a market page', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news', locale: 'en-us' }

    expect(parseShopifyUrl('https://shop.example/en-us/blogs/news/first-post')).toEqual(expected)
  })

  it('should return the blog with a three-letter language', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news', locale: 'fil' }

    expect(parseShopifyUrl('https://shop.example/fil/blogs/news')).toEqual(expected)
  })

  it('should return the blog with a language, script and country', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'videos', locale: 'zh-hant-hk' }

    expect(parseShopifyUrl('https://shop.example/zh-hant-hk/blogs/videos')).toEqual(expected)
  })

  it('should return undefined for a page outside a blog', () => {
    expect(parseShopifyUrl('https://shop.example/products/shirt')).toBeUndefined()
  })

  it('should return undefined for the blogs index', () => {
    expect(parseShopifyUrl('https://shop.example/blogs')).toBeUndefined()
  })
})

describe('shopifyHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(shopifyHandler.match('https://example.com/blogs/news', '', shopifyHeaders)).toBe(true)
    })

    it('should match a blog page with a capitalized blogs segment', () => {
      expect(shopifyHandler.match('https://example.com/Blogs/news', '', shopifyHeaders)).toBe(true)
    })

    it('should match a blog post page', () => {
      const value = 'https://example.com/blogs/news/a-post'

      expect(shopifyHandler.match(value, '', shopifyHeaders)).toBe(true)
    })

    it('should not match the store root', () => {
      expect(shopifyHandler.match('https://example.com/', '', shopifyHeaders)).toBe(false)
    })

    it('should not match a product page', () => {
      const value = 'https://example.com/products/shoes'

      expect(shopifyHandler.match(value, '', shopifyHeaders)).toBe(false)
    })

    it('should not match without the header', () => {
      expect(shopifyHandler.match('https://example.com/blogs/news')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(shopifyHandler.match('not-a-url', '', shopifyHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a page outside a blog', () => {
      expect(shopifyHandler.resolve('https://shop.example/products/shirt')).toEqual([])
    })

    it('should return the blog feed', () => {
      const value = 'https://example.com/blogs/news'
      const expected = [
        {
          uri: 'https://example.com/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the locale folder of a market page', () => {
      const value = 'https://example.com/en-us/blogs/news/a-post'
      const expected = [
        {
          uri: 'https://example.com/en-us/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a language, script and country folder', () => {
      const value = 'https://example.com/zh-hant-hk/blogs/videos/a-post'
      const expected = [
        {
          uri: 'https://example.com/zh-hant-hk/blogs/videos.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should use the blog handle from a post page', () => {
      const value = 'https://example.com/blogs/journal/a-post'
      const expected = [
        {
          uri: 'https://example.com/blogs/journal.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the store root', () => {
      expect(shopifyHandler.resolve('https://example.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    const feedUrls: Array<[string, DiscoverUriHint]> = [
      ['https://example.myshopify.com/blogs/news.atom', { key: 'shopify:blog', label: 'Blog' }],
      [
        'https://example.myshopify.com/en-us/blogs/news.atom',
        { key: 'shopify:blog', label: 'Blog' },
      ],
      ['http://example.myshopify.com/blogs/journal.atom/', { key: 'shopify:blog', label: 'Blog' }],
      [
        'https://example.myshopify.com/blogs/news/tagged/travel.atom',
        { key: 'shopify:blog-tag', label: 'Tag' },
      ],
      [
        'https://example.myshopify.com/fr/blogs/news/tagged/travel.atom',
        { key: 'shopify:blog-tag', label: 'Tag' },
      ],
      [
        'https://example.myshopify.com/collections/shirts.atom',
        { key: 'shopify:collection', label: 'Collection' },
      ],
      [
        'https://example.myshopify.com/en-us/collections/shirts.atom',
        { key: 'shopify:collection', label: 'Collection' },
      ],
      [
        'https://example.myshopify.com/collections/all/blue+cotton.atom',
        { key: 'shopify:collection-tag', label: 'Tagged products' },
      ],
      [
        'https://example.myshopify.com/en-us/collections/all/blue.atom',
        { key: 'shopify:collection-tag', label: 'Tagged products' },
      ],
    ]

    it.each(feedUrls)('should return the hint for %s', (value, expected) => {
      expect(shopifyHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page on a store subdomain', () => {
      const value = 'https://example.myshopify.com/blogs/news'

      expect(shopifyHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a collection page on a store subdomain', () => {
      const value = 'https://example.myshopify.com/collections/all'

      expect(shopifyHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/blogs/news.atom'

      expect(shopifyHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://myshopify.com/blogs/news.atom'

      expect(shopifyHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'https://www.myshopify.com/blogs/news.atom'

      expect(shopifyHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://shop.example.myshopify.com/blogs/news.atom'

      expect(shopifyHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://example.myshopify.com/blogs/news.atom', { key: 'shopify:blog', label: 'Blog' }],
      ['http://example.myshopify.com/fr/blogs/news.atom', { key: 'shopify:blog', label: 'Blog' }],
      [
        'https://example.myshopify.com/blogs/news/tagged/travel.atom',
        { key: 'shopify:blog-tag', label: 'Tag' },
      ],
      [
        'https://example.myshopify.com/collections/shirts.atom',
        { key: 'shopify:collection', label: 'Collection' },
      ],
      [
        'https://example.myshopify.com/collections/all/blue.atom',
        { key: 'shopify:collection-tag', label: 'Tagged products' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [shopifyHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
