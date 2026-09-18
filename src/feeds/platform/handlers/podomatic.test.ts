import { describe, expect, it } from 'bun:test'
import { podomaticHandler } from './podomatic.js'

describe('podomaticHandler', () => {
  describe('match', () => {
    it('should match a show subdomain', () => {
      expect(podomaticHandler.match('https://example-show.podomatic.com/')).toBe(true)
    })

    it('should match a directory path', () => {
      expect(podomaticHandler.match('https://www.podomatic.com/podcasts/example-show')).toBe(true)
    })

    it('should not match the directory index', () => {
      expect(podomaticHandler.match('https://www.podomatic.com/podcasts')).toBe(false)
    })

    it('should not match infrastructure subdomains', () => {
      expect(podomaticHandler.match('https://api.podomatic.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(podomaticHandler.match('https://example.com/podcasts/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(podomaticHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the show feed from a subdomain', () => {
      const value = 'https://example-show.podomatic.com/'
      const expected = [
        {
          uri: 'https://example-show.podomatic.com/rss2.xml',
          hint: { key: 'podomatic:show', label: 'Show' },
        },
      ]

      expect(podomaticHandler.resolve(value)).toEqual(expected)
    })

    it('should map a directory path back to the subdomain', () => {
      const value = 'https://www.podomatic.com/podcasts/example-show'
      const expected = [
        {
          uri: 'https://example-show.podomatic.com/rss2.xml',
          hint: { key: 'podomatic:show', label: 'Show' },
        },
      ]

      expect(podomaticHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the directory index', () => {
      expect(podomaticHandler.resolve('https://www.podomatic.com/podcasts')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(podomaticHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
