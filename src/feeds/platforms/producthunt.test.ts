import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ProducthuntUrl, parseProducthuntUrl, producthuntHandler } from './producthunt.js'

describe('parseProducthuntUrl', () => {
  const productPages: Array<string> = [
    'https://www.producthunt.com/products/notion', // a product page
    'https://www.producthunt.com/Products/notion', // a capitalized products segment
    'https://producthunt.com/products/notion', // the host without www
    'https://www.producthunt.com/products/notion/reviews', // a product subpage
  ]

  it.each(productPages)('should return the product for %s', (value) => {
    const expected: ProducthuntUrl = { kind: 'product', slug: 'notion' }

    expect(parseProducthuntUrl(value)).toEqual(expected)
  })

  const topicPages: Array<string> = [
    'https://www.producthunt.com/topics/productivity', // a topic page
    'https://www.producthunt.com/topics/productivity/', // a trailing slash
    'https://www.producthunt.com/Topics/productivity', // a capitalized topics segment
  ]

  it.each(topicPages)('should return the topic for %s', (value) => {
    const expected: ProducthuntUrl = { kind: 'topic', topic: 'productivity' }

    expect(parseProducthuntUrl(value)).toEqual(expected)
  })

  const homePages: Array<string> = [
    'https://www.producthunt.com/', // the home page
    'https://www.producthunt.com/topics', // the topics index
    'https://www.producthunt.com/topics/productivity/launches', // a topic subpage
    'https://www.producthunt.com/categories/tech', // a category page
    'https://www.producthunt.com/@rrhoover', // a user page
  ]

  it.each(homePages)('should return the home page for %s', (value) => {
    const expected: ProducthuntUrl = { kind: 'home' }

    expect(parseProducthuntUrl(value)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseProducthuntUrl('https://example.com/products/notion')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseProducthuntUrl('not-a-url')).toBeUndefined()
  })
})

describe('producthuntHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.producthunt.com/'],
      [true, 'https://producthunt.com/'],
      [true, 'https://www.producthunt.com/topics/artificial-intelligence'],
      [true, 'https://www.producthunt.com/categories/tech'],
      [false, 'https://example.com/producthunt'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(producthuntHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(producthuntHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Product Hunt', () => {
      expect(producthuntHandler.resolve('https://example.com/')).toEqual([])
    })

    const expected = [
      {
        uri: 'https://www.producthunt.com/feed',
        hint: { key: 'producthunt:products', label: 'Products' },
      },
    ]

    it('should return the products feed for the homepage', () => {
      expect(producthuntHandler.resolve('https://www.producthunt.com/')).toEqual(expected)
    })

    it('should return the products feed for a topic page', () => {
      const value = 'https://www.producthunt.com/topics/artificial-intelligence'

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return the products feed for a category page', () => {
      const value = 'https://www.producthunt.com/categories/tech'

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return the products feed for a product page', () => {
      const value = 'https://www.producthunt.com/posts/some-product'

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    const productsFeeds: Array<string> = [
      'https://www.producthunt.com/feed',
      'https://producthunt.com/feed',
      'http://www.producthunt.com/feed',
      'https://www.producthunt.com/feed/',
      'https://www.producthunt.com/feed?category=example',
      'https://www.producthunt.com/feed?cache=12345',
    ]

    it.each(productsFeeds)('should return the products key for %s', (value) => {
      const expected = 'producthunt:products'

      expect(producthuntHandler.getFeedKey?.(value)).toBe(expected)
    })

    const pages: Array<string> = [
      'https://www.producthunt.com/',
      'https://www.producthunt.com/products/example',
      'https://www.producthunt.com/topics/example',
      'https://www.producthunt.com/products/example/feed',
    ]

    it.each(pages)('should return undefined for the page %s', (value) => {
      expect(producthuntHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/feed'

      expect(producthuntHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<string> = [
      'https://www.producthunt.com/feed',
      'http://producthunt.com/feed',
      'https://www.producthunt.com/feed/',
      'https://www.producthunt.com/feed?category=example',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [producthuntHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'producthunt:products', label: 'Products' } },
      ]

      expect(result).toEqual(expected)
    })
  })
})
