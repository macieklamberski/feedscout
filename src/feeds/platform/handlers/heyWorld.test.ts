import { describe, expect, it } from 'bun:test'
import { heyWorldHandler } from './heyWorld.js'

describe('heyWorldHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://world.hey.com/dhh', true],
      ['https://world.hey.com', true],
      ['https://hey.com', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
