import { describe, expect, it } from 'bun:test'
import { jandanHandler } from './jandan.js'

describe('jandanHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://jandan.net/', true],
      ['https://i.jandan.net/', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(jandanHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for root page', () => {
      const value = 'https://jandan.net/'
      const expected = [
        {
          uri: 'https://jandan.net/?feed=rss2',
          hint: { key: 'jandan:feed', label: 'Feed' },
        },
      ]

      expect(jandanHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for any subpath', () => {
      const value = 'https://jandan.net/top'
      const expected = [
        {
          uri: 'https://jandan.net/?feed=rss2',
          hint: { key: 'jandan:feed', label: 'Feed' },
        },
      ]

      expect(jandanHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for mobile subdomain', () => {
      const value = 'https://i.jandan.net/'
      const expected = [
        {
          uri: 'https://jandan.net/?feed=rss2',
          hint: { key: 'jandan:feed', label: 'Feed' },
        },
      ]

      expect(jandanHandler.resolve(value)).toEqual(expected)
    })
  })
})
