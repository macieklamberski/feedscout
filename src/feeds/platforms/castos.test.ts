import { describe, expect, it } from 'bun:test'
import { castosHandler } from './castos.js'

describe('castosHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice-podcast.castos.com'],
      [true, 'https://alice-podcast.castos.com/episodes/first-episode'],
      [false, 'https://castos.com'],
      [false, 'https://www.castos.com'],
      [false, 'https://app.castos.com/login'],
      [false, 'https://feeds.castos.com/abc12'],
      [false, 'https://support.castos.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(castosHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL linked from the page', () => {
      const value = 'https://alice-podcast.castos.com/episodes/first-episode'
      const content =
        '<link type="application/rss+xml" rel="alternate" href="https://feeds.castos.com/abc12" />'
      const expected = [
        {
          uri: 'https://feeds.castos.com/abc12',
          hint: { key: 'castos:podcast', label: 'Podcast' },
        },
      ]

      expect(castosHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return show site feed URL without page content', () => {
      const value = 'https://alice-podcast.castos.com'
      const expected = [
        {
          uri: 'https://alice-podcast.castos.com/feed',
          hint: { key: 'castos:podcast', label: 'Podcast' },
        },
      ]

      expect(castosHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the bare host', () => {
      expect(castosHandler.resolve('https://castos.com/')).toEqual([])
    })
  })
})
