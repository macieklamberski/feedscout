import { describe, expect, it } from 'bun:test'
import { podbeanHandler } from './podbean.js'

describe('podbeanHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://kickstartcommerce.podbean.com', true],
      ['https://blog.example.podbean.com', true],
      ['https://podbean.com', false],
      ['https://example.com', false],
      ['https://www.podbean.com', false],
      ['https://support.podbean.com', false],
      ['https://feed.podbean.com', false],
      ['https://pbcdn1.podbean.com', false],
      ['https://sponsorship.podbean.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
