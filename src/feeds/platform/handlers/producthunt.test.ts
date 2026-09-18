import { describe, expect, it } from 'bun:test'
import { producthuntHandler } from './producthunt.js'

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
