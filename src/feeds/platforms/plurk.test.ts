import { describe, expect, it } from 'bun:test'
import { plurkHandler } from './plurk.js'

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
