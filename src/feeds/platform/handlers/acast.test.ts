import { describe, expect, it } from 'bun:test'
import { acastHandler } from './acast.js'

describe('acastHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://shows.acast.com/my-dad-wrote-a-porno', true],
      ['https://shows.acast.com', true],
      ['https://play.acast.com/s/my-dad-wrote-a-porno', true],
      ['https://embed.acast.com/my-dad-wrote-a-porno', true],
      ['https://acast.com/show', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(acastHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(acastHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return podcast feed for show', () => {
      const value = 'https://shows.acast.com/my-dad-wrote-a-porno'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://shows.acast.com/my-dad-wrote-a-porno/some-episode'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://shows.acast.com/'

      expect(acastHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://shows.acast.com/discover'

      expect(acastHandler.resolve(value)).toEqual([])
    })

    it('should return podcast feed for play.acast.com/s/{slug}', () => {
      const value = 'https://play.acast.com/s/my-dad-wrote-a-porno'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })

    it('should return podcast feed for embed.acast.com/{slug}', () => {
      const value = 'https://embed.acast.com/my-dad-wrote-a-porno'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })
  })
})
