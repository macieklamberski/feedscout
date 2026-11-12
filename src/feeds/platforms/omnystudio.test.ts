import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type OmnystudioUrl, omnystudioHandler, parseOmnystudioUrl } from './omnystudio.js'

describe('parseOmnystudioUrl', () => {
  it('should return the show for a show page', () => {
    const expected: OmnystudioUrl = { kind: 'show', show: 'example-show' }

    expect(parseOmnystudioUrl('https://omny.fm/shows/example-show')).toEqual(expected)
  })

  it('should return undefined for the site root', () => {
    expect(parseOmnystudioUrl('https://omny.fm/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseOmnystudioUrl('https://example.com/shows/example-show')).toBeUndefined()
  })
})

describe('omnystudioHandler', () => {
  describe('match', () => {
    it('should match a show page', () => {
      expect(omnystudioHandler.match('https://omny.fm/shows/example-show')).toBe(true)
    })

    it('should match a show page with a capitalized shows segment', () => {
      expect(omnystudioHandler.match('https://omny.fm/Shows/example-show')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(omnystudioHandler.match('https://omny.fm/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(omnystudioHandler.match('https://example.com/shows/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(omnystudioHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the show feed', () => {
      const value = 'https://omny.fm/shows/example-show'
      const expected = [
        {
          uri: 'https://omny.fm/shows/example-show/playlists/podcast.rss',
          hint: { key: 'omnystudio:show', label: 'Show' },
        },
      ]

      expect(omnystudioHandler.resolve(value)).toEqual(expected)
    })

    it('should use the slug from an episode page', () => {
      const value = 'https://omny.fm/shows/example-show/an-episode'
      const expected = [
        {
          uri: 'https://omny.fm/shows/example-show/playlists/podcast.rss',
          hint: { key: 'omnystudio:show', label: 'Show' },
        },
      ]

      expect(omnystudioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https feed for an http show page', () => {
      const value = 'http://omny.fm/shows/example-show'
      const expected = [
        {
          uri: 'https://omny.fm/shows/example-show/playlists/podcast.rss',
          hint: { key: 'omnystudio:show', label: 'Show' },
        },
      ]

      expect(omnystudioHandler.resolve(value)).toEqual(expected)
    })

    it('should return the apex feed for a www show page', () => {
      const value = 'https://www.omny.fm/shows/example-show'
      const expected = [
        {
          uri: 'https://omny.fm/shows/example-show/playlists/podcast.rss',
          hint: { key: 'omnystudio:show', label: 'Show' },
        },
      ]

      expect(omnystudioHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(omnystudioHandler.resolve('https://omny.fm/')).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the show key for a show feed', () => {
      const value = 'https://omny.fm/shows/example-show/playlists/podcast.rss'
      const expected = 'omnystudio:show'

      expect(omnystudioHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the show key for an http show feed', () => {
      const value = 'http://omny.fm/shows/example-show/playlists/podcast.rss'
      const expected = 'omnystudio:show'

      expect(omnystudioHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a show page', () => {
      const value = 'https://omny.fm/shows/example-show'

      expect(omnystudioHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the playlist page without the rss suffix', () => {
      const value = 'https://omny.fm/shows/example-show/playlists/podcast'

      expect(omnystudioHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a show feed path on another host', () => {
      const value = 'https://example.com/shows/example-show/playlists/podcast.rss'

      expect(omnystudioHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'omnystudio:show', label: 'Show' }
    const values = [
      'https://omny.fm/shows/example-show/playlists/podcast.rss',
      'https://omny.fm/shows/example-show/playlists/podcast.rss/',
      'http://omny.fm/shows/example-show/playlists/podcast.rss',
      'https://www.omny.fm/shows/example-show/playlists/podcast.rss',
      'https://omny.fm/Shows/example-show/playlists/podcast.rss',
    ]

    it.each(values)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [omnystudioHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
