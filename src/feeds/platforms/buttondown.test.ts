import { describe, expect, it } from 'bun:test'
import { type ButtondownUrl, buttondownHandler, parseButtondownUrl } from './buttondown.js'

describe('parseButtondownUrl', () => {
  it('should return the newsletter for a newsletter page', () => {
    const expected: ButtondownUrl = { kind: 'newsletter', username: 'cassidoo' }

    expect(parseButtondownUrl('https://buttondown.com/cassidoo')).toEqual(expected)
  })

  it('should return undefined for an excluded path', () => {
    expect(parseButtondownUrl('https://buttondown.com/pricing')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseButtondownUrl('https://buttondown.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseButtondownUrl('https://example.com/cassidoo')).toBeUndefined()
  })
})

describe('buttondownHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://buttondown.com/cassidoo'],
      [true, 'https://www.buttondown.com/user'],
      [false, 'https://buttondown.com'],
      [true, 'https://buttondown.email/cassidoo'],
      [true, 'https://www.buttondown.email/cassidoo'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(buttondownHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(buttondownHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(buttondownHandler.resolve('https://example.com/')).toEqual([])
    })

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

    it('should return empty array for a capitalized excluded path', () => {
      const value = 'https://buttondown.com/Login'

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
