import { describe, expect, it } from 'bun:test'
import { type PodomaticUrl, parsePodomaticUrl, podomaticHandler } from './podomatic.js'

describe('parsePodomaticUrl', () => {
  it('should return the podcast for a show subdomain', () => {
    const expected: PodomaticUrl = { kind: 'podcast', show: 'example-show' }

    expect(parsePodomaticUrl('https://example-show.podomatic.com/')).toEqual(expected)
  })

  it('should return the podcast for a directory path', () => {
    const expected: PodomaticUrl = { kind: 'podcast', show: 'example-show' }

    expect(parsePodomaticUrl('https://www.podomatic.com/podcasts/example-show')).toEqual(expected)
  })

  it('should return undefined for the directory index', () => {
    expect(parsePodomaticUrl('https://www.podomatic.com/podcasts')).toBeUndefined()
  })

  it('should return undefined for an infrastructure subdomain', () => {
    expect(parsePodomaticUrl('https://api.podomatic.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePodomaticUrl('https://example.com/podcasts/example-show')).toBeUndefined()
  })
})

describe('podomaticHandler', () => {
  describe('match', () => {
    it('should match a show subdomain', () => {
      expect(podomaticHandler.match('https://example-show.podomatic.com/')).toBe(true)
    })

    it('should match a directory path', () => {
      expect(podomaticHandler.match('https://www.podomatic.com/podcasts/example-show')).toBe(true)
    })

    it('should match a directory path with a capitalized podcasts segment', () => {
      expect(podomaticHandler.match('https://www.podomatic.com/Podcasts/example-show')).toBe(true)
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
  })
})
