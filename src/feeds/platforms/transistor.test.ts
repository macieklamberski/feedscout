import { describe, expect, it } from 'bun:test'
import { parseTransistorUrl, type TransistorUrl, transistorHandler } from './transistor.js'

describe('parseTransistorUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: TransistorUrl = { kind: 'show', slug: 'example' }

    expect(parseTransistorUrl('https://example.transistor.fm/')).toEqual(expected)
  })

  it('should return undefined for an excluded subdomain', () => {
    expect(parseTransistorUrl('https://www.transistor.fm/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTransistorUrl('https://example.com/')).toBeUndefined()
  })
})

describe('transistorHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.transistor.fm'],
      [true, 'https://blog.example.transistor.fm'],
      [false, 'https://transistor.fm'],
      [false, 'https://example.com'],
      [false, 'https://www.transistor.fm'],
      [false, 'https://feeds.transistor.fm'],
      [false, 'https://share.transistor.fm'],
      [false, 'https://support.transistor.fm'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(transistorHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(transistorHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Transistor', () => {
      expect(transistorHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast', () => {
      const value = 'https://alice-podcast.transistor.fm'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice-podcast',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed slug the show page links when it differs from the subdomain', () => {
      const value = 'https://alice.transistor.fm'
      const content = '<link rel="alternate" href="https://feeds.transistor.fm/alice-podcast">'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice-podcast',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value, content)).toEqual(expected)
    })

    it('should fall back to the subdomain when the page links no feed', () => {
      const value = 'https://alice.transistor.fm'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value, '<html></html>')).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice-podcast.transistor.fm/episodes/some-episode'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/alice-podcast',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(transistorHandler.resolve('https://transistor.fm/')).toEqual([])
    })
  })
})
