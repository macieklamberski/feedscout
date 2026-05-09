import { describe, expect, it } from 'bun:test'
import { transistorHandler } from './transistor.js'

describe('transistorHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://build-your-saas.transistor.fm', true],
      ['https://blog.example.transistor.fm', true],
      ['https://transistor.fm', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(transistorHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(transistorHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for podcast', () => {
      const value = 'https://build-your-saas.transistor.fm'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/build-your-saas',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://build-your-saas.transistor.fm/episodes/some-episode'
      const expected = [
        {
          uri: 'https://feeds.transistor.fm/build-your-saas',
          hint: { key: 'transistor:podcast', label: 'Podcast' },
        },
      ]

      expect(transistorHandler.resolve(value)).toEqual(expected)
    })
  })
})
