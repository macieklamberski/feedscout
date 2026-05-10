import { describe, expect, it } from 'bun:test'
import { observableHandler } from './observable.js'

describe('observableHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://observablehq.com/@mbostock', true],
      ['https://www.observablehq.com/@user', true],
      ['https://observablehq.com', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(observableHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(observableHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://observablehq.com/@mbostock'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/@mbostock.rss',
          hint: { key: 'observable:notebooks', label: 'Notebooks' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://observablehq.com/@mbostock/some-notebook'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/@mbostock.rss',
          hint: { key: 'observable:notebooks', label: 'Notebooks' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for collection', () => {
      const value = 'https://observablehq.com/@observablehq/collection/visualization'
      const expected = [
        {
          uri: 'https://api.observablehq.com/collection/@observablehq/visualization.rss',
          hint: { key: 'observable:collection', label: 'Collection' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://observablehq.com/'

      expect(observableHandler.resolve(value)).toEqual([])
    })

    it('should return recent feed for /recent', () => {
      const value = 'https://observablehq.com/recent'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: { key: 'observable:recent', label: 'Recent' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending', () => {
      const value = 'https://observablehq.com/trending'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: { key: 'observable:trending', label: 'Trending' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths without @ prefix', () => {
      const value = 'https://observablehq.com/about'

      expect(observableHandler.resolve(value)).toEqual([])
    })
  })
})
