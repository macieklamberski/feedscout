import { describe, expect, it } from 'bun:test'
import { type CaptivateUrl, captivateHandler, parseCaptivateUrl } from './captivate.js'

describe('parseCaptivateUrl', () => {
  it('should return the show for a show subdomain', () => {
    const expected: CaptivateUrl = { kind: 'show', slug: 'myshow' }

    expect(parseCaptivateUrl('https://myshow.captivate.fm/')).toEqual(expected)
  })

  it('should return undefined for an excluded subdomain', () => {
    expect(parseCaptivateUrl('https://www.captivate.fm/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseCaptivateUrl('https://example.com/')).toBeUndefined()
  })
})

describe('captivateHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.captivate.fm'],
      [true, 'https://alice-podcast.captivate.fm/listen'],
      [false, 'https://captivate.fm'],
      [false, 'https://www.captivate.fm'],
      [false, 'https://feeds.captivate.fm/alice-podcast/'],
      [false, 'https://player.captivate.fm'],
      [false, 'https://help.captivate.fm'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(captivateHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(captivateHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(captivateHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for podcast', () => {
      const value = 'https://alice-podcast.captivate.fm'
      const expected = [
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/',
          hint: { key: 'captivate:podcast', label: 'Podcast' },
        },
      ]

      expect(captivateHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice-podcast.captivate.fm/episodes'
      const expected = [
        {
          uri: 'https://feeds.captivate.fm/alice-podcast/',
          hint: { key: 'captivate:podcast', label: 'Podcast' },
        },
      ]

      expect(captivateHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(captivateHandler.resolve('https://captivate.fm/')).toEqual([])
    })
  })
})
