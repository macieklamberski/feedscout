import { describe, expect, it } from 'bun:test'
import type { SoundcloudUrl } from './soundcloud.js'
import { parseSoundcloudUrl, soundcloudHandler } from './soundcloud.js'

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

  it('should return undefined for excluded paths', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com/discover')).toBeUndefined()
    expect(parseSoundcloudUrl('https://soundcloud.com/stream')).toBeUndefined()
    expect(parseSoundcloudUrl('https://soundcloud.com/search')).toBeUndefined()
    expect(parseSoundcloudUrl('https://soundcloud.com/upload')).toBeUndefined()
    expect(parseSoundcloudUrl('https://soundcloud.com/you')).toBeUndefined()
    expect(parseSoundcloudUrl('https://soundcloud.com/settings')).toBeUndefined()
    expect(parseSoundcloudUrl('https://soundcloud.com/messages')).toBeUndefined()
  })

  it('should return undefined for excluded paths in any case', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com/Discover')).toBeUndefined()
    expect(parseSoundcloudUrl('https://soundcloud.com/STREAM')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseSoundcloudUrl('https://soundcloud.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSoundcloudUrl('https://example.com/diplo')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseSoundcloudUrl('not-a-url')).toBeUndefined()
  })
})

describe('soundcloudHandler', () => {
  describe('match', () => {
    it('should match a profile page', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/diplo')).toBe(true)
    })

    it('should not match an excluded path', () => {
      expect(soundcloudHandler.match('https://soundcloud.com/discover')).toBe(false)
    })
  })

  describe('resolve', () => {
    const contentWithUserId = `
      <meta property="twitter:app:url:googleplay" content="soundcloud://users:16730">
      <meta property="al:ios:url" content="soundcloud://users:16730">
    `

    it('should return RSS feed when user ID found in content', () => {
      const value = 'https://soundcloud.com/diplo'
      const expected = [
        {
          uri: 'https://feeds.soundcloud.com/users/soundcloud:users:16730/sounds.rss',
          hint: { key: 'soundcloud:tracks', label: 'Tracks' },
        },
      ]

      expect(soundcloudHandler.resolve(value, contentWithUserId)).toEqual(expected)
    })

    it('should return empty array when no content provided', () => {
      const value = 'https://soundcloud.com/diplo'

      expect(soundcloudHandler.resolve(value)).toEqual([])
    })

    it('should return empty array when user ID not found in content', () => {
      const value = 'https://soundcloud.com/diplo'
      const content = '<html><body>No user ID here</body></html>'

      expect(soundcloudHandler.resolve(value, content)).toEqual([])
    })
  })
})
