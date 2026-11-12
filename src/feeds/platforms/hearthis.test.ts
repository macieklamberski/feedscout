import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type HearthisUrl, hearthisHandler, parseHearthisUrl } from './hearthis.js'

describe('parseHearthisUrl', () => {
  it('should return the profile for a user page', () => {
    const expected: HearthisUrl = { kind: 'profile', username: 'djname' }

    expect(parseHearthisUrl('https://hearthis.at/djname/')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseHearthisUrl('https://hearthis.at/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHearthisUrl('https://example.com/')).toBeUndefined()
  })
})

describe('hearthisHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://hearthis.at/james-monty-montgomery'],
      [true, 'https://www.hearthis.at/user'],
      [false, 'https://hearthis.at'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hearthisHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hearthisHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside hearthis.at', () => {
      expect(hearthisHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for user', () => {
      const value = 'https://hearthis.at/james-monty-montgomery'
      const expected = [
        {
          uri: 'https://hearthis.at/james-monty-montgomery/podcast/',
          hint: { key: 'hearthis:tracks', label: 'Tracks' },
        },
        {
          uri: 'https://hearthis.at/new_tracks.rss',
          hint: { key: 'hearthis:new-tracks', label: 'New tracks' },
        },
      ]

      expect(hearthisHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://hearthis.at/james-monty-montgomery/some-track'
      const expected = [
        {
          uri: 'https://hearthis.at/james-monty-montgomery/podcast/',
          hint: { key: 'hearthis:tracks', label: 'Tracks' },
        },
        {
          uri: 'https://hearthis.at/new_tracks.rss',
          hint: { key: 'hearthis:new-tracks', label: 'New tracks' },
        },
      ]

      expect(hearthisHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://hearthis.at/'

      expect(hearthisHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the tracks key for a user feed', () => {
      const value = 'https://hearthis.at/alice/podcast/'
      const expected = 'hearthis:tracks'

      expect(hearthisHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tracks key for a user feed without a trailing slash', () => {
      const value = 'https://hearthis.at/alice/podcast'
      const expected = 'hearthis:tracks'

      expect(hearthisHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tracks key for a user feed over http on www', () => {
      const value = 'http://www.hearthis.at/alice/podcast/'
      const expected = 'hearthis:tracks'

      expect(hearthisHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the new tracks key for the new tracks feed', () => {
      const value = 'https://hearthis.at/new_tracks.rss'
      const expected = 'hearthis:new-tracks'

      expect(hearthisHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user page', () => {
      const value = 'https://hearthis.at/alice/'

      expect(hearthisHandler.getFeedKey?.(value)).toBeUndefined()
    })

    const genrePages = [
      'https://hearthis.at/categories/podcast/',
      'https://hearthis.at/tags/podcast/',
      'https://hearthis.at/artists/podcast/',
      'https://hearthis.at/maps/podcast/',
    ]

    it.each(genrePages)('should return undefined for the genre page %s', (value) => {
      expect(hearthisHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/alice/podcast/'

      expect(hearthisHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const tracksHint: DiscoverUriHint = { key: 'hearthis:tracks', label: 'Tracks' }
    const newTracksHint: DiscoverUriHint = { key: 'hearthis:new-tracks', label: 'New tracks' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://hearthis.at/alice/podcast/', tracksHint],
      ['http://www.hearthis.at/alice/podcast', tracksHint],
      ['https://hearthis.at/new_tracks.rss', newTracksHint],
      ['http://www.hearthis.at/new_tracks.rss', newTracksHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [hearthisHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
