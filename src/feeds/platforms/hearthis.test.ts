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
      [true, 'https://hearthis.at/alice-smith'],
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
      const value = 'https://hearthis.at/alice-smith'
      const expected = [
        {
          uri: 'https://hearthis.at/alice-smith/podcast/',
          hint: { key: 'hearthis:tracks', label: 'Tracks' },
        },
        {
          uri: 'https://hearthis.at/alice-smith/rss/',
          hint: { key: 'hearthis:track-list', label: 'Track list' },
        },
        {
          uri: 'https://hearthis.at/new_tracks.rss',
          hint: { key: 'hearthis:new-tracks', label: 'New tracks' },
        },
      ]

      expect(hearthisHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://hearthis.at/alice-smith/some-track'
      const expected = [
        {
          uri: 'https://hearthis.at/alice-smith/podcast/',
          hint: { key: 'hearthis:tracks', label: 'Tracks' },
        },
        {
          uri: 'https://hearthis.at/alice-smith/rss/',
          hint: { key: 'hearthis:track-list', label: 'Track list' },
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

  describe('getFeedHint', () => {
    it('should return the tracks key for a user feed spelled podcast.xml', () => {
      const value = 'https://hearthis.at/alice/podcast.xml'
      const expected: DiscoverUriHint = { key: 'hearthis:tracks', label: 'Tracks' }

      expect(hearthisHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a user feed spelled podcast.xml as itself', async () => {
      const value = 'https://hearthis.at/alice/podcast.xml'
      const hint: DiscoverUriHint = { key: 'hearthis:tracks', label: 'Tracks' }
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
