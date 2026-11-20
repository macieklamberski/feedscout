import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PromodjUrl, parsePromodjUrl, promodjHandler } from './promodj.js'

describe('parsePromodjUrl', () => {
  it('should return the profile for a profile page', () => {
    const expected: PromodjUrl = { kind: 'profile', username: 'someartist' }

    expect(parsePromodjUrl('https://promodj.com/someartist')).toEqual(expected)
  })

  it('should return the profile for a mix page', () => {
    const expected: PromodjUrl = { kind: 'profile', username: 'someartist' }

    expect(parsePromodjUrl('https://promodj.com/someartist/mixes/1234567/Summer_Mix')).toEqual(
      expected,
    )
  })

  it('should return the profile for a username with a dot', () => {
    const expected: PromodjUrl = { kind: 'profile', username: 'dj.someartist' }

    expect(parsePromodjUrl('https://promodj.com/dj.someartist')).toEqual(expected)
  })

  it('should return the profile on the www host', () => {
    const expected: PromodjUrl = { kind: 'profile', username: 'someartist' }

    expect(parsePromodjUrl('https://www.promodj.com/someartist')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parsePromodjUrl('https://promodj.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePromodjUrl('https://example.com/someartist')).toBeUndefined()
  })
})

describe('promodjHandler', () => {
  describe('match', () => {
    it('should match a profile page', () => {
      expect(promodjHandler.match('https://promodj.com/someartist')).toBe(true)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside PromoDJ', () => {
      expect(promodjHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the profile feeds', () => {
      const value = 'https://promodj.com/someartist'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://promodj.com/someartist/podcast.xml',
          hint: { key: 'promodj:podcast', label: 'Podcast' },
        },
        {
          uri: 'https://promodj.com/someartist/rss.xml',
          hint: { key: 'promodj:content', label: 'Content' },
        },
        {
          uri: 'https://promodj.com/someartist/blog.xml',
          hint: { key: 'promodj:blog', label: 'Blog' },
        },
        {
          uri: 'https://promodj.com/someartist/bookmarks.xml',
          hint: { key: 'promodj:favorites', label: 'Favorites' },
        },
        {
          uri: 'https://promodj.com/someartist/avisha.xml',
          hint: { key: 'promodj:events', label: 'Events' },
        },
      ]

      expect(promodjHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of a capitalized username', () => {
      const value = 'https://promodj.com/SomeArtist'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://promodj.com/SomeArtist/podcast.xml',
          hint: { key: 'promodj:podcast', label: 'Podcast' },
        },
        {
          uri: 'https://promodj.com/SomeArtist/rss.xml',
          hint: { key: 'promodj:content', label: 'Content' },
        },
        {
          uri: 'https://promodj.com/SomeArtist/blog.xml',
          hint: { key: 'promodj:blog', label: 'Blog' },
        },
        {
          uri: 'https://promodj.com/SomeArtist/bookmarks.xml',
          hint: { key: 'promodj:favorites', label: 'Favorites' },
        },
        {
          uri: 'https://promodj.com/SomeArtist/avisha.xml',
          hint: { key: 'promodj:events', label: 'Events' },
        },
      ]

      expect(promodjHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the podcast key for an alternate podcast feed', () => {
      const value = 'https://promodj.com/dj.someartist/podcast_alt.xml'
      const expected: DiscoverUriHint = { key: 'promodj:podcast', label: 'Podcast' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a content feed as itself', async () => {
      const value = 'https://promodj.com/dj.someartist/rss.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [promodjHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://promodj.com/dj.someartist/rss.xml',
          hint: { key: 'promodj:content', label: 'Content' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
