import { describe, expect, it } from 'bun:test'
import { transistorHandler } from './transistor.js'

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
