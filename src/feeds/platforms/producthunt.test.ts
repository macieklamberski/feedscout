import { describe, expect, it } from 'bun:test'
import { type ProducthuntUrl, parseProducthuntUrl, producthuntHandler } from './producthunt.js'

describe('parseProducthuntUrl', () => {
  it('should return the home page for any page', () => {
    const expected: ProducthuntUrl = { kind: 'home' }

    expect(parseProducthuntUrl('https://www.producthunt.com/products/example')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseProducthuntUrl('https://example.com/')).toBeUndefined()
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
