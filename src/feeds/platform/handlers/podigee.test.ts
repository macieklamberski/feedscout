import { describe, expect, it } from 'bun:test'
import { podigeeHandler } from './podigee.js'

describe('podigeeHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://cui-bono.podigee.io', true],
      ['https://anything.podigee.io/episodes', true],
      ['https://podigee.io', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(podigeeHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(podigeeHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return podcast feed for show', () => {
      const value = 'https://cui-bono.podigee.io'
      const expected = [
        {
          uri: 'https://cui-bono.podigee.io/feed/mp3',
          hint: { key: 'podigee:podcast', label: 'Podcast' },
        },
      ]

      expect(podigeeHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://cui-bono.podigee.io/episodes/123'
      const expected = [
        {
          uri: 'https://cui-bono.podigee.io/feed/mp3',
          hint: { key: 'podigee:podcast', label: 'Podcast' },
        },
      ]

      expect(podigeeHandler.resolve(value)).toEqual(expected)
    })
  })
})
