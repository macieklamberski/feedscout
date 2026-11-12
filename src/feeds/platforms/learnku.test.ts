import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type LearnkuUrl, learnkuHandler, parseLearnkuUrl } from './learnku.js'

describe('parseLearnkuUrl', () => {
  it('should return the community for a community page', () => {
    const expected: LearnkuUrl = { kind: 'community', community: 'laravel' }

    expect(parseLearnkuUrl('https://learnku.com/laravel')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: LearnkuUrl = { kind: 'home' }

    expect(parseLearnkuUrl('https://learnku.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseLearnkuUrl('https://example.com/')).toBeUndefined()
  })
})

describe('learnkuHandler', () => {
  describe('match', () => {
    it('should match a LearnKu URL', () => {
      expect(learnkuHandler.match('https://learnku.com/laravel')).toBe(true)
      expect(learnkuHandler.match('https://learnku.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(learnkuHandler.match('https://example.com/laravel')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(learnkuHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside LearnKu', () => {
      expect(learnkuHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the community and site feeds for a community page', () => {
      const value = 'https://learnku.com/laravel'
      const expected = [
        {
          uri: 'https://learnku.com/laravel/feed',
          hint: { key: 'learnku:community', label: 'Community' },
        },
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site feed for the home page', () => {
      const value = 'https://learnku.com/'
      const expected = [
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds on the apex for an http www page', () => {
      const value = 'http://www.learnku.com/laravel'
      const expected = [
        {
          uri: 'https://learnku.com/laravel/feed',
          hint: { key: 'learnku:community', label: 'Community' },
        },
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    const feedKeys: Array<[string, string]> = [
      ['https://learnku.com/feed', 'learnku:site'],
      ['http://learnku.com/feed', 'learnku:site'],
      ['https://learnku.com/feed/', 'learnku:site'],
      ['https://learnku.com/example/feed', 'learnku:community'],
      ['http://learnku.com/example/feed', 'learnku:community'],
      ['https://learnku.com/example/feed/', 'learnku:community'],
      ['https://www.learnku.com/example/feed', 'learnku:community'],
    ]

    it.each(feedKeys)('should return the key of %s', (value, expected) => {
      expect(learnkuHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a community page', () => {
      const value = 'https://learnku.com/example'

      expect(learnkuHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the home page', () => {
      const value = 'https://learnku.com/'

      expect(learnkuHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/example/feed'

      expect(learnkuHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://learnku.com/feed', { key: 'learnku:site', label: 'Site' }],
      ['http://learnku.com/feed', { key: 'learnku:site', label: 'Site' }],
      ['https://learnku.com/feed/', { key: 'learnku:site', label: 'Site' }],
      ['https://learnku.com/example/feed', { key: 'learnku:community', label: 'Community' }],
      ['http://learnku.com/example/feed', { key: 'learnku:community', label: 'Community' }],
      ['https://learnku.com/example/feed/', { key: 'learnku:community', label: 'Community' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [learnkuHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
