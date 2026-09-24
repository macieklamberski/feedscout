import { describe, expect, it } from 'bun:test'
import { neocitiesHandler } from './neocities.js'

describe('neocitiesHandler', () => {
  describe('match', () => {
    it('should match a site subdomain', () => {
      expect(neocitiesHandler.match('https://example-site.neocities.org/')).toBe(true)
    })

    it('should match a profile path on the main host', () => {
      expect(neocitiesHandler.match('https://neocities.org/site/example-site')).toBe(true)
    })

    it('should not match the main host without a site path', () => {
      expect(neocitiesHandler.match('https://neocities.org/')).toBe(false)
      expect(neocitiesHandler.match('https://neocities.org/browse')).toBe(false)
    })

    it('should not match a custom domain', () => {
      expect(neocitiesHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(neocitiesHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the updates feed for a site subdomain', () => {
      const value = 'https://example-site.neocities.org/'
      const expected = [
        {
          uri: 'https://neocities.org/site/example-site.rss',
          hint: { key: 'neocities:updates', label: 'Site updates' },
        },
      ]

      expect(neocitiesHandler.resolve(value)).toEqual(expected)
    })

    it('should return the updates feed for a profile path', () => {
      const value = 'https://neocities.org/site/example-site'
      const expected = [
        {
          uri: 'https://neocities.org/site/example-site.rss',
          hint: { key: 'neocities:updates', label: 'Site updates' },
        },
      ]

      expect(neocitiesHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the main host root', () => {
      expect(neocitiesHandler.resolve('https://neocities.org/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(neocitiesHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
