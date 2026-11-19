import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { SoundcloudPage, SoundcloudUrl } from './soundcloud.js'
import { getSoundcloudPage, parseSoundcloudUrl, soundcloudHandler } from './soundcloud.js'

const userIdHtml = `
  <meta property="twitter:app:url:googleplay" content="soundcloud://users:24680">
  <meta property="al:ios:url" content="soundcloud://users:24680">
`
const playlistIdHtml = `
  <meta property="twitter:app:url:googleplay" content="soundcloud://playlists:12345">
  <meta property="al:ios:url" content="soundcloud://playlists:12345">
`

describe('parseSoundcloudUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'alice' }

    expect(parseSoundcloudUrl('https://soundcloud.com/alice')).toEqual(expected)
  })

  it('should return the user for a trailing slash', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'alice' }

    expect(parseSoundcloudUrl('https://soundcloud.com/alice/')).toEqual(expected)
  })

  it('should return the user for the www and mobile hosts', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'alice' }

    expect(parseSoundcloudUrl('https://www.soundcloud.com/alice')).toEqual(expected)
    expect(parseSoundcloudUrl('https://m.soundcloud.com/alice')).toEqual(expected)
  })

  it('should return the user for user subpages', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'alice' }

    expect(parseSoundcloudUrl('https://soundcloud.com/alice/tracks')).toEqual(expected)
    expect(parseSoundcloudUrl('https://soundcloud.com/alice/likes')).toEqual(expected)
  })

  it('should return the user for track and playlist pages', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'alice' }

    expect(parseSoundcloudUrl('https://soundcloud.com/alice/first-song')).toEqual(expected)
    expect(parseSoundcloudUrl('https://soundcloud.com/alice/sets/summer')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for a first segment outside the permalink alphabet', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com/%40alice')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSoundcloudUrl('https://example.com/alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseSoundcloudUrl('not-a-url')).toBeUndefined()
  })
})

describe('getSoundcloudPage', () => {
  const value = 'https://soundcloud.com/alice'

  it('should return the user id the page carries', () => {
    const expected: SoundcloudPage = { kind: 'user', userId: '24680' }

    expect(getSoundcloudPage(value, userIdHtml)).toEqual(expected)
  })

  it('should return the playlist id a playlist page carries', () => {
    const value = 'https://soundcloud.com/alice/sets/example'
    const expected: SoundcloudPage = { kind: 'playlist', playlistId: '12345' }

    expect(getSoundcloudPage(value, playlistIdHtml)).toEqual(expected)
  })

  it('should return undefined without content', () => {
    expect(getSoundcloudPage(value, undefined)).toBeUndefined()
  })

  it('should return undefined when the content carries no user id', () => {
    const content = '<html><body>No user ID here</body></html>'

    expect(getSoundcloudPage(value, content)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(getSoundcloudPage('https://example.com/alice', userIdHtml)).toBeUndefined()
  })
})

describe('soundcloudHandler', () => {
  describe('match', () => {
    it('should match a profile page', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/alice')).toBe(true)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed when user ID found in content', () => {
      const value = 'https://soundcloud.com/alice'
      const expected = [
        {
          uri: 'https://feeds.soundcloud.com/users/soundcloud:users:24680/sounds.rss',
          hint: { key: 'soundcloud:tracks', label: 'Tracks' },
        },
      ]

      expect(soundcloudHandler.resolve(value, userIdHtml)).toEqual(expected)
    })

    it('should return the playlist feed when the page carries a playlist id', () => {
      const value = 'https://soundcloud.com/alice/sets/example'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://feeds.soundcloud.com/playlists/soundcloud:sets:12345/sounds.rss',
          hint: { key: 'soundcloud:playlist', label: 'Playlist' },
        },
      ]

      expect(soundcloudHandler.resolve(value, playlistIdHtml)).toEqual(expected)
    })

    it('should return nothing when the page carries no user id', () => {
      const value = 'https://soundcloud.com/alice'
      const expected: Array<DiscoverUriEntry> = []

      expect(soundcloudHandler.resolve(value, undefined)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the playlist hint for a playlist feed under soundcloud:playlists', () => {
      const value = 'https://feeds.soundcloud.com/playlists/soundcloud:playlists:12345/sounds.rss'
      const expected: DiscoverUriHint = { key: 'soundcloud:playlist', label: 'Playlist' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a playlist feed under soundcloud:playlists as itself', async () => {
      const value = 'https://feeds.soundcloud.com/playlists/soundcloud:playlists:12345/sounds.rss'
      const hint: DiscoverUriHint = { key: 'soundcloud:playlist', label: 'Playlist' }
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [soundcloudHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
