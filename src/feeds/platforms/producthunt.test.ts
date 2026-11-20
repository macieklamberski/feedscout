import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
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
    'https://www.producthunt.com/@alice', // a user page
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

    it('should return the category and products feeds for a topic page', () => {
      const value = 'https://www.producthunt.com/topics/artificial-intelligence'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.producthunt.com/feed?category=artificial-intelligence',
          hint: { key: 'producthunt:category', label: 'Category' },
        },
        {
          uri: 'https://www.producthunt.com/feed',
          hint: { key: 'producthunt:products', label: 'Products' },
        },
      ]

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

  describe('getFeedHint', () => {
    it('should return the products hint for the feed on the bare host', () => {
      const value = 'https://producthunt.com/feed'
      const expected: DiscoverUriHint = { key: 'producthunt:products', label: 'Products' }

      expect(producthuntHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a category feed on the bare host over http as itself', async () => {
      const value = 'http://producthunt.com/feed?category=example'
      const options = {
        ...defaultPlatformOptions,
        handlers: [producthuntHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://producthunt.com/feed?category=example',
          hint: { key: 'producthunt:category', label: 'Category' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
