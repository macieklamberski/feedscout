import { describe, expect, it } from 'bun:test'
import { podigeeHandler } from './podigee.js'

describe('podigeeHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://cui-bono.podigee.io'],
      [true, 'https://anything.podigee.io/episodes'],
      [false, 'https://podigee.io'],
      [false, 'https://example.com'],
      [false, 'https://www.podigee.io'],
      [false, 'https://app.podigee.io'],
      [false, 'https://help.podigee.io'],
      [false, 'https://blog.podigee.io'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
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

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
