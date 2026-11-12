import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseRoyalroadUrl, type RoyalroadUrl, royalroadHandler } from './royalroad.js'

const fictionHint: DiscoverUriHint = { key: 'royalroad:fiction', label: 'Fiction' }
const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://www.royalroad.com/syndication/12345', fictionHint],
  ['https://www.royalroad.com/fiction/syndication/12345', fictionHint],
  ['https://www.royalroad.com/syndication/12345?count=1', fictionHint],
  ['http://royalroad.com/syndication/12345/', fictionHint],
]

describe('parseRoyalroadUrl', () => {
  it('should return the fiction for a chapter page', () => {
    const value =
      'https://www.royalroad.com/fiction/21220/mother-of-learning/chapter/301778/1-good-morning-brother'
    const expected: RoyalroadUrl = { kind: 'fiction', fictionId: '21220' }

    expect(parseRoyalroadUrl(value)).toEqual(expected)
  })

  it('should return undefined for a profile page', () => {
    expect(parseRoyalroadUrl('https://www.royalroad.com/profile/100374')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseRoyalroadUrl('https://example.com/fiction/21220')).toBeUndefined()
  })
})

describe('royalroadHandler', () => {
  describe('match', () => {
    it('should match a fiction page', () => {
      const value = 'https://www.royalroad.com/fiction/21220/mother-of-learning'

      expect(royalroadHandler.match(value)).toBe(true)
    })

    it('should match a chapter page', () => {
      const value =
        'https://www.royalroad.com/fiction/21220/mother-of-learning/chapter/301778/1-good-morning-brother'

      expect(royalroadHandler.match(value)).toBe(true)
    })

    it('should match a fiction page without the slug', () => {
      expect(royalroadHandler.match('https://www.royalroad.com/fiction/21220')).toBe(true)
    })

    it('should match the bare host', () => {
      expect(royalroadHandler.match('https://royalroad.com/fiction/21220')).toBe(true)
    })

    it('should match route words in any case', () => {
      expect(royalroadHandler.match('https://www.royalroad.com/Fiction/21220')).toBe(true)
    })

    it('should not match a profile page', () => {
      expect(royalroadHandler.match('https://www.royalroad.com/profile/100374')).toBe(false)
    })

    it('should not match a fiction list', () => {
      const value = 'https://www.royalroad.com/fictions/latest-updates'

      expect(royalroadHandler.match(value)).toBe(false)
    })

    it('should not match another host', () => {
      expect(royalroadHandler.match('https://example.com/fiction/21220')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the fiction feed for a chapter page', () => {
      const value =
        'https://www.royalroad.com/fiction/21220/mother-of-learning/chapter/301778/1-good-morning-brother'
      const expected = [
        {
          uri: 'https://www.royalroad.com/syndication/21220',
          hint: { key: 'royalroad:fiction', label: 'Fiction' },
        },
      ]

      expect(royalroadHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array without a fiction id', () => {
      expect(royalroadHandler.resolve('https://www.royalroad.com/profile/100374')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the fiction key for a fiction feed', () => {
      const value = 'https://www.royalroad.com/syndication/12345'
      const expected = 'royalroad:fiction'

      expect(royalroadHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the fiction key for a fiction feed under the fiction path', () => {
      const value = 'https://www.royalroad.com/fiction/syndication/12345'
      const expected = 'royalroad:fiction'

      expect(royalroadHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the fiction key for a fiction feed with a count', () => {
      const value = 'https://www.royalroad.com/syndication/12345?count=1'
      const expected = 'royalroad:fiction'

      expect(royalroadHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the fiction key for a fiction feed on the bare host', () => {
      const value = 'http://royalroad.com/syndication/12345/'
      const expected = 'royalroad:fiction'

      expect(royalroadHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a word in place of the fiction id', () => {
      const value = 'https://www.royalroad.com/syndication/latest'

      expect(royalroadHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a fiction page', () => {
      const value = 'https://www.royalroad.com/fiction/12345'

      expect(royalroadHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/syndication/12345'

      expect(royalroadHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [royalroadHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
