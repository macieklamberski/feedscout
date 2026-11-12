import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { SoundcloudPage, SoundcloudUrl } from './soundcloud.js'
import { getSoundcloudPage, parseSoundcloudUrl, soundcloudHandler } from './soundcloud.js'

const userIdHtml = `
  <meta property="twitter:app:url:googleplay" content="soundcloud://users:16730">
  <meta property="al:ios:url" content="soundcloud://users:16730">
`
const playlistIdHtml = `
  <meta property="twitter:app:url:googleplay" content="soundcloud://playlists:12345">
  <meta property="al:ios:url" content="soundcloud://playlists:12345">
`

describe('parseSoundcloudUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'diplo' }

    expect(parseSoundcloudUrl('https://soundcloud.com/diplo')).toEqual(expected)
  })

  it('should return the user for a trailing slash', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'diplo' }

    expect(parseSoundcloudUrl('https://soundcloud.com/diplo/')).toEqual(expected)
  })

  it('should return the user for the www and mobile hosts', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'diplo' }

    expect(parseSoundcloudUrl('https://www.soundcloud.com/diplo')).toEqual(expected)
    expect(parseSoundcloudUrl('https://m.soundcloud.com/diplo')).toEqual(expected)
  })

  it('should return the user for user subpages', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'diplo' }

    expect(parseSoundcloudUrl('https://soundcloud.com/diplo/tracks')).toEqual(expected)
    expect(parseSoundcloudUrl('https://soundcloud.com/diplo/likes')).toEqual(expected)
  })

  it('should return the user for track and playlist pages', () => {
    const expected: SoundcloudUrl = { kind: 'user', username: 'diplo' }

    expect(parseSoundcloudUrl('https://soundcloud.com/diplo/first-song')).toEqual(expected)
    expect(parseSoundcloudUrl('https://soundcloud.com/diplo/sets/summer')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com/robots.txt')).toBeUndefined()
  })

  it('should return undefined for a first segment outside the permalink alphabet', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com/%40diplo')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSoundcloudUrl('https://example.com/diplo')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseSoundcloudUrl('not-a-url')).toBeUndefined()
  })
})

describe('getSoundcloudPage', () => {
  const value = 'https://soundcloud.com/diplo'

  it('should return the user id the page carries', () => {
    const expected: SoundcloudPage = { kind: 'user', userId: '16730' }

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
    expect(getSoundcloudPage('https://example.com/diplo', userIdHtml)).toBeUndefined()
  })
})

describe('soundcloudHandler', () => {
  describe('match', () => {
    it('should match a profile page', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/diplo')).toBe(true)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed when user ID found in content', () => {
      const value = 'https://soundcloud.com/diplo'
      const expected = [
        {
          uri: 'https://feeds.soundcloud.com/users/soundcloud:users:16730/sounds.rss',
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
    it('should return the tracks hint for a user feed', () => {
      const value = 'https://feeds.soundcloud.com/users/soundcloud:users:12345/sounds.rss'
      const expected: DiscoverUriHint = { key: 'soundcloud:tracks', label: 'Tracks' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tracks hint for a user feed without sounds.rss', () => {
      const value = 'https://feeds.soundcloud.com/users/soundcloud:users:12345'
      const expected: DiscoverUriHint = { key: 'soundcloud:tracks', label: 'Tracks' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tracks hint for an http user feed', () => {
      const value = 'http://feeds.soundcloud.com/users/soundcloud:users:12345/sounds.rss'
      const expected: DiscoverUriHint = { key: 'soundcloud:tracks', label: 'Tracks' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tracks hint for a paged user feed', () => {
      const value =
        'https://feeds.soundcloud.com/users/soundcloud:users:12345/sounds.rss?before=67890'
      const expected: DiscoverUriHint = { key: 'soundcloud:tracks', label: 'Tracks' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a user feed with a word in place of the id', () => {
      const value = 'https://feeds.soundcloud.com/users/soundcloud:users:alice/sounds.rss'

      expect(soundcloudHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a user feed with a word before the id', () => {
      const value = 'https://feeds.soundcloud.com/users/soundcloud:users:alice:12345/sounds.rss'

      expect(soundcloudHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the playlist hint for a playlist feed', () => {
      const value = 'https://feeds.soundcloud.com/playlists/soundcloud:sets:12345/sounds.rss'
      const expected: DiscoverUriHint = { key: 'soundcloud:playlist', label: 'Playlist' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the playlist hint for a playlist feed without sounds.rss', () => {
      const value = 'https://feeds.soundcloud.com/playlists/soundcloud:sets:12345'
      const expected: DiscoverUriHint = { key: 'soundcloud:playlist', label: 'Playlist' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the playlist hint for a playlist feed under soundcloud:playlists', () => {
      const value = 'https://feeds.soundcloud.com/playlists/soundcloud:playlists:12345/sounds.rss'
      const expected: DiscoverUriHint = { key: 'soundcloud:playlist', label: 'Playlist' }

      expect(soundcloudHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a playlist feed with a word in place of the id', () => {
      const value = 'https://feeds.soundcloud.com/playlists/soundcloud:sets:alice/sounds.rss'

      expect(soundcloudHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://soundcloud.com/alice'

      expect(soundcloudHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/users/soundcloud:users:12345/sounds.rss'

      expect(soundcloudHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const tracksHint: DiscoverUriHint = { key: 'soundcloud:tracks', label: 'Tracks' }
    const playlistHint: DiscoverUriHint = { key: 'soundcloud:playlist', label: 'Playlist' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://feeds.soundcloud.com/users/soundcloud:users:12345/sounds.rss', tracksHint],
      ['http://feeds.soundcloud.com/users/soundcloud:users:12345/sounds.rss', tracksHint],
      ['https://feeds.soundcloud.com/users/soundcloud:users:12345', tracksHint],
      ['https://feeds.soundcloud.com/playlists/soundcloud:sets:12345/sounds.rss', playlistHint],
      ['https://feeds.soundcloud.com/playlists/soundcloud:sets:12345', playlistHint],
      [
        'https://feeds.soundcloud.com/playlists/soundcloud:playlists:12345/sounds.rss',
        playlistHint,
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
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
