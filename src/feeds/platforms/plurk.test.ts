import { describe, expect, it } from 'bun:test'
import { type PlurkUrl, parsePlurkUrl, plurkHandler } from './plurk.js'

describe('parsePlurkUrl', () => {
  it('should return the post for a post page', () => {
    const expected: PlurkUrl = { kind: 'post', postId: 'abc123' }

    expect(parsePlurkUrl('https://www.plurk.com/p/abc123')).toEqual(expected)
  })

  it('should return the post for a mobile post page', () => {
    const expected: PlurkUrl = { kind: 'post', postId: 'abc123' }

    expect(parsePlurkUrl('https://www.plurk.com/m/p/abc123')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: PlurkUrl = { kind: 'user', username: 'alice' }

    expect(parsePlurkUrl('https://www.plurk.com/alice')).toEqual(expected)
  })

  it('should return the user for a user path', () => {
    const expected: PlurkUrl = { kind: 'user', username: 'alice' }

    expect(parsePlurkUrl('https://www.plurk.com/u/alice')).toEqual(expected)
  })

  it('should return a page for a site route', () => {
    const expected: PlurkUrl = { kind: 'page' }

    expect(parsePlurkUrl('https://www.plurk.com/top')).toEqual(expected)
  })

  it('should return a page for the root', () => {
    const expected: PlurkUrl = { kind: 'page' }

    expect(parsePlurkUrl('https://www.plurk.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parsePlurkUrl('https://example.com/alice')).toBeUndefined()
  })
})

describe('plurkHandler', () => {
  describe('match', () => {
    it('should match a plurk.com URL', () => {
      expect(plurkHandler.match('https://www.plurk.com/alice')).toBe(true)
    })

    it('should not match another host', () => {
      expect(plurkHandler.match('https://example.com/alice')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Plurk', () => {
      expect(plurkHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the user feed for a user page', () => {
      const value = 'https://www.plurk.com/alice'
      const expected = [
        {
          uri: 'https://www.plurk.com/alice.xml',
          hint: { key: 'plurk:plurks', label: 'Plurks' },
        },
      ]

      expect(plurkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a user page without www', () => {
      const value = 'https://plurk.com/alice/'
      const expected = [
        {
          uri: 'https://www.plurk.com/alice.xml',
          hint: { key: 'plurk:plurks', label: 'Plurks' },
        },
      ]

      expect(plurkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a /u/ user page', () => {
      const value = 'https://www.plurk.com/u/alice'
      const expected = [
        {
          uri: 'https://www.plurk.com/alice.xml',
          hint: { key: 'plurk:plurks', label: 'Plurks' },
        },
      ]

      expect(plurkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a mobile user page', () => {
      const value = 'https://www.plurk.com/m/alice/friends'
      const expected = [
        {
          uri: 'https://www.plurk.com/alice.xml',
          hint: { key: 'plurk:plurks', label: 'Plurks' },
        },
      ]

      expect(plurkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a desktop user named after a mobile route', () => {
      const value = 'https://www.plurk.com/wallet'
      const expected = [
        {
          uri: 'https://www.plurk.com/wallet.xml',
          hint: { key: 'plurk:plurks', label: 'Plurks' },
        },
      ]

      expect(plurkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the responses feed for a post page', () => {
      const value = 'https://www.plurk.com/p/3j6p8yayds'
      const expected = [
        {
          uri: 'https://www.plurk.com/p/3j6p8yayds.xml',
          hint: { key: 'plurk:responses', label: 'Responses' },
        },
      ]

      expect(plurkHandler.resolve(value)).toEqual(expected)
    })

    it('should return the responses feed for a mobile post page', () => {
      const value = 'https://www.plurk.com/m/p/3j6p8yayds'
      const expected = [
        {
          uri: 'https://www.plurk.com/p/3j6p8yayds.xml',
          hint: { key: 'plurk:responses', label: 'Responses' },
        },
      ]

      expect(plurkHandler.resolve(value)).toEqual(expected)
    })

    it('should return nothing for a reserved path', () => {
      expect(plurkHandler.resolve('https://www.plurk.com/top')).toEqual([])
    })

    it('should return nothing for a reserved path in another case', () => {
      expect(plurkHandler.resolve('https://www.plurk.com/Settings')).toEqual([])
    })

    it('should return nothing for a reserved mobile path', () => {
      expect(plurkHandler.resolve('https://www.plurk.com/m/notify')).toEqual([])
    })

    it('should return nothing for a post path without an id', () => {
      expect(plurkHandler.resolve('https://www.plurk.com/p')).toEqual([])
    })

    it('should return nothing for the home page', () => {
      expect(plurkHandler.resolve('https://www.plurk.com/')).toEqual([])
    })
  })

  describe('guessExclusionRegex', () => {
    it('should match a guessed root feed, which is a user feed on Plurk', () => {
      expect(plurkHandler.guessExclusionRegex?.test('https://www.plurk.com/feed.xml')).toBe(true)
    })

    it('should not match a post feed', () => {
      expect(plurkHandler.guessExclusionRegex?.test('https://www.plurk.com/p/abc.xml')).toBe(false)
    })
  })
})
