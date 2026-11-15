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
    it('should return the podcast key for a podcast feed', () => {
      const value = 'https://promodj.com/dj.someartist/podcast.xml'
      const expected: DiscoverUriHint = { key: 'promodj:podcast', label: 'Podcast' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the content key for a content feed', () => {
      const value = 'https://promodj.com/dj.someartist/rss.xml'
      const expected: DiscoverUriHint = { key: 'promodj:content', label: 'Content' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog key for a blog feed', () => {
      const value = 'https://promodj.com/dj.someartist/blog.xml'
      const expected: DiscoverUriHint = { key: 'promodj:blog', label: 'Blog' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the favorites key for a bookmarks feed', () => {
      const value = 'https://promodj.com/dj.someartist/bookmarks.xml'
      const expected: DiscoverUriHint = { key: 'promodj:favorites', label: 'Favorites' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events key for an events feed', () => {
      const value = 'https://promodj.com/dj.someartist/avisha.xml'
      const expected: DiscoverUriHint = { key: 'promodj:events', label: 'Events' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast key for a capitalized username on the www host', () => {
      const value = 'http://www.promodj.com/SomeArtist/podcast.xml'
      const expected: DiscoverUriHint = { key: 'promodj:podcast', label: 'Podcast' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the podcast key for an alternate podcast feed', () => {
      const value = 'https://promodj.com/dj.someartist/podcast_alt.xml'
      const expected: DiscoverUriHint = { key: 'promodj:podcast', label: 'Podcast' }

      expect(promodjHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://promodj.com/dj.someartist'

      expect(promodjHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a genre feed', () => {
      const value = 'https://promodj.com/mixes/house/rss.xml'

      expect(promodjHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/dj.someartist/podcast.xml'

      expect(promodjHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://promodj.com/dj.someartist/podcast.xml',
        { key: 'promodj:podcast', label: 'Podcast' },
      ],
      ['https://promodj.com/dj.someartist/rss.xml', { key: 'promodj:content', label: 'Content' }],
      ['https://promodj.com/dj.someartist/blog.xml', { key: 'promodj:blog', label: 'Blog' }],
      [
        'https://promodj.com/dj.someartist/bookmarks.xml',
        { key: 'promodj:favorites', label: 'Favorites' },
      ],
      ['https://promodj.com/dj.someartist/avisha.xml', { key: 'promodj:events', label: 'Events' }],
      ['https://promodj.com/SomeArtist/podcast.xml', { key: 'promodj:podcast', label: 'Podcast' }],
      [
        'https://promodj.com/dj.someartist/podcast_alt.xml',
        { key: 'promodj:podcast', label: 'Podcast' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [promodjHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
