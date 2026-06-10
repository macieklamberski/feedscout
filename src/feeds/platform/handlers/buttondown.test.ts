import { describe, expect, it } from 'bun:test'
import { buttondownHandler } from './buttondown.js'

describe('buttondownHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://buttondown.com/cassidoo', true],
      ['https://www.buttondown.com/user', true],
      ['https://buttondown.com', true],
      ['https://buttondown.email/cassidoo', true],
      ['https://www.buttondown.email/cassidoo', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(buttondownHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(buttondownHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for newsletter', () => {
      const value = 'https://buttondown.com/cassidoo'
      const expected = [
        {
          uri: 'https://buttondown.com/cassidoo/rss',
          hint: { key: 'buttondown:newsletter', label: 'Newsletter' },
        },
      ]

      expect(buttondownHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://buttondown.com/cassidoo/archive'
      const expected = [
        {
          uri: 'https://buttondown.com/cassidoo/rss',
          hint: { key: 'buttondown:newsletter', label: 'Newsletter' },
        },
      ]

      expect(buttondownHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://buttondown.com/'

      expect(buttondownHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://buttondown.com/login'

      expect(buttondownHandler.resolve(value)).toEqual([])
    })

    it('should canonicalise legacy buttondown.email host to buttondown.com feed', () => {
      const value = 'https://buttondown.email/cassidoo'
      const expected = [
        {
          uri: 'https://buttondown.com/cassidoo/rss',
          hint: { key: 'buttondown:newsletter', label: 'Newsletter' },
        },
      ]

      expect(buttondownHandler.resolve(value)).toEqual(expected)
    })
  })
})
