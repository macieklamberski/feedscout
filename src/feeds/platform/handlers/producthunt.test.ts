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
    it('should return main feed for homepage', () => {
      const value = 'https://www.producthunt.com/'
      const expected = [
        {
          uri: 'https://www.producthunt.com/feed',
          hint: { key: 'producthunt:products', label: 'Products' },
        },
      ]

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return topic feed for topic page', () => {
      const value = 'https://www.producthunt.com/topics/artificial-intelligence'
      const expected = [
        {
          uri: 'https://www.producthunt.com/feed?topic=artificial-intelligence',
          hint: { key: 'producthunt:topic', label: 'Topic' },
        },
      ]

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feed for category page', () => {
      const value = 'https://www.producthunt.com/categories/tech'
      const expected = [
        {
          uri: 'https://www.producthunt.com/feed?category=tech',
          hint: { key: 'producthunt:category', label: 'Category' },
        },
      ]

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it('should return main feed for product page', () => {
      const value = 'https://www.producthunt.com/posts/some-product'
      const expected = [
        {
          uri: 'https://www.producthunt.com/feed',
          hint: { key: 'producthunt:products', label: 'Products' },
        },
      ]

      expect(producthuntHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
