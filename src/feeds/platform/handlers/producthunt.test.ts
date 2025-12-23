import { describe, expect, it } from 'bun:test'
import { producthuntHandler } from './producthunt.js'

describe('producthuntHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.producthunt.com/', true],
      ['https://producthunt.com/', true],
      ['https://www.producthunt.com/topics/artificial-intelligence', true],
      ['https://www.producthunt.com/categories/tech', true],
      ['https://example.com/producthunt', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(producthuntHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return main feed for homepage', () => {
      const value = 'https://www.producthunt.com/'
      const expected = ['https://www.producthunt.com/feed']

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return topic feed for topic page', () => {
      const value = 'https://www.producthunt.com/topics/artificial-intelligence'
      const expected = ['https://www.producthunt.com/feed?topic=artificial-intelligence']

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for category page', () => {
      const value = 'https://www.producthunt.com/categories/tech'
      const expected = ['https://www.producthunt.com/feed?category=tech']

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return main feed for product page', () => {
      const value = 'https://www.producthunt.com/posts/some-product'
      const expected = ['https://www.producthunt.com/feed']

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })
  })
})
