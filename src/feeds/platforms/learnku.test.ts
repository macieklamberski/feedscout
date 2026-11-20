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
      const expected: Array<DiscoverUriEntry> = [
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
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feeds on the apex for an http www page', () => {
      const value = 'http://www.learnku.com/laravel'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://learnku.com/laravel/feed',
          hint: { key: 'learnku:community', label: 'Community' },
        },
        { uri: 'https://learnku.com/feed', hint: { key: 'learnku:site', label: 'Site' } },
      ]

      expect(learnkuHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the community hint for a community feed on www', () => {
      const value = 'https://www.learnku.com/example/feed'
      const expected: DiscoverUriHint = { key: 'learnku:community', label: 'Community' }

      expect(learnkuHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a feed as itself', async () => {
      const value = 'http://learnku.com/example/feed'
      const options = {
        ...defaultPlatformOptions,
        handlers: [learnkuHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://learnku.com/example/feed',
          hint: { key: 'learnku:community', label: 'Community' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
