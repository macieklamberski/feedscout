import { describe, expect, it } from 'bun:test'
import { podbeanHandler } from './podbean.js'

describe('podbeanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://kickstartcommerce.podbean.com'],
      [true, 'https://blog.example.podbean.com'],
      [false, 'https://podbean.com'],
      [false, 'https://example.com'],
      [false, 'https://www.podbean.com'],
      [false, 'https://support.podbean.com'],
      [false, 'https://feed.podbean.com'],
      [false, 'https://pbcdn1.podbean.com'],
      [false, 'https://sponsorship.podbean.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(podbeanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(podbeanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://kickstartcommerce.podbean.com'
      const expected = [
        {
          uri: 'https://feed.podbean.com/kickstartcommerce/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://kickstartcommerce.podbean.com/e/some-episode'
      const expected = [
        {
          uri: 'https://feed.podbean.com/kickstartcommerce/feed.xml',
          hint: { key: 'podbean:podcast', label: 'Podcast' },
        },
      ]

      expect(podbeanHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
