import { describe, expect, it } from 'bun:test'
import { type ProducthuntUrl, parseProducthuntUrl, producthuntHandler } from './producthunt.js'

describe('parseProducthuntUrl', () => {
  const productPages: Array<[string, string]> = [
    ['a product page', 'https://www.producthunt.com/products/notion'],
    ['a capitalized products segment', 'https://www.producthunt.com/Products/notion'],
    ['the host without www', 'https://producthunt.com/products/notion'],
    ['a product subpage', 'https://www.producthunt.com/products/notion/reviews'],
  ]

  it.each(productPages)('should return the product for %s', (_name, value) => {
    const expected: ProducthuntUrl = { kind: 'product', slug: 'notion' }

    expect(parseProducthuntUrl(value)).toEqual(expected)
  })

  const topicPages: Array<[string, string]> = [
    ['a topic page', 'https://www.producthunt.com/topics/productivity'],
    ['a trailing slash', 'https://www.producthunt.com/topics/productivity/'],
    ['a capitalized topics segment', 'https://www.producthunt.com/Topics/productivity'],
  ]

  it.each(topicPages)('should return the topic for %s', (_name, value) => {
    const expected: ProducthuntUrl = { kind: 'topic', topic: 'productivity' }

    expect(parseProducthuntUrl(value)).toEqual(expected)
  })

  const homePages: Array<[string, string]> = [
    ['the home page', 'https://www.producthunt.com/'],
    ['the topics index', 'https://www.producthunt.com/topics'],
    ['a topic subpage', 'https://www.producthunt.com/topics/productivity/launches'],
    ['a category page', 'https://www.producthunt.com/categories/tech'],
    ['a user page', 'https://www.producthunt.com/@rrhoover'],
  ]

  it.each(homePages)('should return the home page for %s', (_name, value) => {
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
})
