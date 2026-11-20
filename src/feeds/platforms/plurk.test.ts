import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  it('should return undefined for the root', () => {
    expect(parsePlurkUrl('https://www.plurk.com/')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parsePlurkUrl('https://www.plurk.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for a post path without an id', () => {
    expect(parsePlurkUrl('https://www.plurk.com/p')).toBeUndefined()
  })

  it('should return undefined for the mobile root', () => {
    expect(parsePlurkUrl('https://www.plurk.com/m/')).toBeUndefined()
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

    it('should not match a file of the site', () => {
      expect(plurkHandler.match('https://www.plurk.com/robots.txt')).toBe(false)
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
  })

  describe('getFeedHint', () => {
    it('should return the plurks hint for a user feed under /user/', () => {
      const value = 'https://www.plurk.com/user/alice.xml'
      const expected: DiscoverUriHint = { key: 'plurk:plurks', label: 'Plurks' }

      expect(plurkHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('discoverUrisFromPlatform', () => {
    it('should return a user feed as itself', async () => {
      const value = 'https://www.plurk.com/alice.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [plurkHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'plurk:plurks', label: 'Plurks' } },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
