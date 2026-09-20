import { describe, expect, it } from 'bun:test'
import { heyWorldHandler } from './heyWorld.js'

describe('heyWorldHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://world.hey.com/dhh'],
      [true, 'https://world.hey.com'],
      [false, 'https://hey.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(heyWorldHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(heyWorldHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://world.hey.com/dhh'
      const expected = [
        {
          uri: 'https://world.hey.com/dhh/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(heyWorldHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://world.hey.com/dhh/some-post-title'
      const expected = [
        {
          uri: 'https://world.hey.com/dhh/feed.atom',
          hint: { key: 'hey-world:blog', label: 'Blog' },
        },
      ]

      expect(heyWorldHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://world.hey.com/'

      expect(heyWorldHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
