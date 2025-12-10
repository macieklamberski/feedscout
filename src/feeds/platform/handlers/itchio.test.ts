import { describe, expect, it } from 'bun:test'
import { itchioHandler } from './itchio.js'

describe('itchioHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://leafo.itch.io', true],
      ['https://leafo.itch.io/superdisc', true],
      ['https://itch.io/games', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(itchioHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for creator page', () => {
      const value = 'https://leafo.itch.io'
      const expected = ['https://leafo.itch.io/feed.xml']

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for game page', () => {
      const value = 'https://leafo.itch.io/superdisc'
      const expected = ['https://leafo.itch.io/feed.xml']

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return devlog RSS for devlog page', () => {
      const value = 'https://leafo.itch.io/superdisc/devlog'
      const expected = ['https://leafo.itch.io/superdisc/devlog.rss']

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })
  })
})
