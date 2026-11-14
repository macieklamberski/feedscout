import { describe, expect, it } from 'bun:test'
import type { SoundcloudPage, SoundcloudUrl } from './soundcloud.js'
import { getSoundcloudPage, parseSoundcloudUrl, soundcloudHandler } from './soundcloud.js'

const userIdHtml = `
  <meta property="twitter:app:url:googleplay" content="soundcloud://users:24680">
  <meta property="al:ios:url" content="soundcloud://users:24680">
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
  })
})
