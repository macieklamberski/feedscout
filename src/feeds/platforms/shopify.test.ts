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

  it('should return the blog for a market page', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news' }

    expect(parseShopifyUrl('https://shop.example/en-us/blogs/news/first-post')).toEqual(expected)
  })

  it('should return the blog under a three-letter language', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news' }

    expect(parseShopifyUrl('https://shop.example/fil/blogs/news')).toEqual(expected)
  })

  it('should return the blog under a language, script and country', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'videos' }

    expect(parseShopifyUrl('https://shop.example/zh-hant-hk/blogs/videos')).toEqual(expected)
  })

  it('should return undefined for a well-formed code that names no language', () => {
    const value = 'https://shop.example/xx/blogs/news'

    expect(parseShopifyUrl(value)).toBeUndefined()
  })

  it('should return the blog and tag for a blog tag page', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news', tag: 'travel' }

    expect(parseShopifyUrl('https://shop.example/blogs/news/tagged/travel')).toEqual(expected)
  })

  it('should drop the format from the tag of a blog tag feed', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news', tag: 'travel' }

    expect(parseShopifyUrl('https://shop.example/blogs/news/tagged/travel.atom')).toEqual(expected)
  })

  it('should drop the format from the handle of a blog feed', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news' }

    expect(parseShopifyUrl('https://shop.example/blogs/news.atom')).toEqual(expected)
  })

  it('should drop the format from the handle of a market blog feed', () => {
    const expected: ShopifyUrl = { kind: 'blog', handle: 'news' }

    expect(parseShopifyUrl('https://shop.example/en-us/blogs/news.atom')).toEqual(expected)
  })

  it('should return undefined for a format with no handle', () => {
    expect(parseShopifyUrl('https://shop.example/blogs/.atom')).toBeUndefined()
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

    it('should return the bare blog feed for a market page', () => {
      const value = 'https://example.com/en-us/blogs/news/a-post'
      const expected = [
        {
          uri: 'https://example.com/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should return the bare blog feed for a language, script and country folder', () => {
      const value = 'https://example.com/zh-hant-hk/blogs/videos/a-post'
      const expected = [
        {
          uri: 'https://example.com/blogs/videos.atom',
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

    it('should return the blog feed itself for a blog feed', () => {
      const value = 'https://example.com/blogs/news.atom'
      const expected = [
        {
          uri: 'https://example.com/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should return the bare blog feed for a market blog feed', () => {
      const value = 'https://example.com/en-us/blogs/news.atom'
      const expected = [
        {
          uri: 'https://example.com/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog and tag feeds for a blog tag page', () => {
      const value = 'https://example.com/blogs/news/tagged/travel'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.com/blogs/news/tagged/travel.atom',
          hint: { key: 'shopify:blog-tag', label: 'Tag' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog and tag feeds for a blog tag feed', () => {
      const value = 'https://example.com/blogs/news/tagged/travel.atom'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.com/blogs/news/tagged/travel.atom',
          hint: { key: 'shopify:blog-tag', label: 'Tag' },
        },
      ]

      expect(shopifyHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for a collection feed', () => {
      expect(shopifyHandler.resolve('https://example.com/collections/shoes.atom')).toEqual([])
    })

    it('should return an empty array for the store root', () => {
      expect(shopifyHandler.resolve('https://example.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the hint for a tagged collection feed under a market folder', () => {
      const value = 'https://example.myshopify.com/en-us/collections/all/blue.atom'
      const expected: DiscoverUriHint = {
        key: 'shopify:collection-tag',
        label: 'Tagged products',
      }

      expect(shopifyHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a market blog feed as itself', async () => {
      const value = 'http://example.myshopify.com/fr/blogs/news.atom'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.myshopify.com/fr/blogs/news.atom',
          hint: { key: 'shopify:blog', label: 'Blog' },
        },
      ]
      const uris = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [shopifyHandler],
        baseUrl: value,
      })

      expect(uris).toEqual(expected)
    })
  })
})
