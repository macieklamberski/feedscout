import { describe, expect, it } from 'bun:test'
import type { DeviantartUrl } from './deviantart.js'
import { deviantartHandler, parseDeviantartUrl } from './deviantart.js'

describe('parseDeviantartUrl', () => {
  it('should return the profile for a profile page', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'alice' }

    expect(parseDeviantartUrl('https://deviantart.com/alice')).toEqual(expected)
  })

  it('should return the profile for the www host', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'alice' }

    expect(parseDeviantartUrl('https://www.deviantart.com/alice')).toEqual(expected)
  })

  it('should return the profile for a profile page with a trailing slash', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'alice' }

    expect(parseDeviantartUrl('https://www.deviantart.com/alice/')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'ArtistName' }

    expect(parseDeviantartUrl('https://www.deviantart.com/ArtistName')).toEqual(expected)
  })

  it('should return a username with underscores and hyphens', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'some_user-name' }

    expect(parseDeviantartUrl('https://deviantart.com/some_user-name')).toEqual(expected)
  })

  it('should return a single-character username', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'x' }

    expect(parseDeviantartUrl('https://www.deviantart.com/x')).toEqual(expected)
  })

  it('should return the profile for a gallery page', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'alice' }

    expect(parseDeviantartUrl('https://www.deviantart.com/alice/gallery')).toEqual(expected)
    expect(parseDeviantartUrl('https://deviantart.com/alice/gallery/all')).toEqual(expected)
  })

  it('should return the author profile for a deviation page', () => {
    const value = 'https://www.deviantart.com/alice/art/some-art-123'
    const expected: DeviantartUrl = { kind: 'profile', username: 'alice' }

    expect(parseDeviantartUrl(value)).toEqual(expected)
  })

  it('should return the folder for a gallery folder page', () => {
    const value = 'https://deviantart.com/alice/gallery/123456/folder-name'
    const expected: DeviantartUrl = { kind: 'folder', username: 'alice', folderId: '123456' }

    expect(parseDeviantartUrl(value)).toEqual(expected)
  })

  it('should return the folder for a gallery folder page with a capitalized gallery segment', () => {
    const value = 'https://deviantart.com/alice/Gallery/123456/folder-name'
    const expected: DeviantartUrl = { kind: 'folder', username: 'alice', folderId: '123456' }

    expect(parseDeviantartUrl(value)).toEqual(expected)
  })

  it('should return the favourites for a favourites page', () => {
    const expected: DeviantartUrl = { kind: 'favourites', username: 'alice' }

    expect(parseDeviantartUrl('https://deviantart.com/alice/favourites')).toEqual(expected)
  })

  it('should return the favourites for a favourites page with a capitalized favourites segment', () => {
    const expected: DeviantartUrl = { kind: 'favourites', username: 'alice' }

    expect(parseDeviantartUrl('https://deviantart.com/alice/Favourites')).toEqual(expected)
  })

  it('should return the journal for a journal page', () => {
    const expected: DeviantartUrl = { kind: 'journal', username: 'alice' }

    expect(parseDeviantartUrl('https://deviantart.com/alice/journal')).toEqual(expected)
  })

  it('should return the journal for a journal page with a capitalized journal segment', () => {
    const expected: DeviantartUrl = { kind: 'journal', username: 'alice' }

    expect(parseDeviantartUrl('https://deviantart.com/alice/Journal')).toEqual(expected)
  })

  it('should return the journal for a journal post', () => {
    const value = 'https://deviantart.com/alice/journal/some-post-slug'
    const expected: DeviantartUrl = { kind: 'journal', username: 'alice' }

    expect(parseDeviantartUrl(value)).toEqual(expected)
  })

  it('should return the tag for a tag page', () => {
    const expected: DeviantartUrl = { kind: 'tag', tag: 'photography' }

    expect(parseDeviantartUrl('https://deviantart.com/tag/photography')).toEqual(expected)
  })

  it('should return the tag for a tag page with a capitalized tag segment', () => {
    const expected: DeviantartUrl = { kind: 'tag', tag: 'photography' }

    expect(parseDeviantartUrl('https://deviantart.com/Tag/photography')).toEqual(expected)
  })

  it('should decode a percent-encoded tag', () => {
    const expected: DeviantartUrl = { kind: 'tag', tag: 'café' }

    expect(parseDeviantartUrl('https://deviantart.com/tag/caf%C3%A9')).toEqual(expected)
  })

  it('should return the daily deviations page', () => {
    const expected: DeviantartUrl = { kind: 'dailyDeviations' }

    expect(parseDeviantartUrl('https://www.deviantart.com/Daily-Deviations/')).toEqual(expected)
  })

  it('should return undefined for a first segment with a dot', () => {
    expect(parseDeviantartUrl('https://www.deviantart.com/a.b')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseDeviantartUrl('https://www.deviantart.com')).toBeUndefined()
    expect(parseDeviantartUrl('https://www.deviantart.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseDeviantartUrl('https://example.com/alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDeviantartUrl('not-a-url')).toBeUndefined()
  })
})

describe('deviantartHandler', () => {
  describe('match', () => {
    it('should match DeviantArt URLs', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/alice')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(deviantartHandler.match('https://example.com/alice')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://deviantart.com/alice'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=by:alice%20sort:time%20meta:all',
          hint: { key: 'deviantart:deviations', label: 'Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for specific gallery folder', () => {
      const value = 'https://deviantart.com/alice/gallery/123456/folder-name'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery:alice/123456',
          hint: { key: 'deviantart:gallery', label: 'Gallery' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for favourites', () => {
      const value = 'https://deviantart.com/alice/favourites'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=favby:alice',
          hint: { key: 'deviantart:favorites', label: 'Favorites' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://deviantart.com/tag/photography'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag:photography',
          hint: { key: 'deviantart:tag', label: 'Tag' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a percent-encoded tag encoded once', () => {
      const value = 'https://deviantart.com/tag/caf%C3%A9'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag:café',
          hint: { key: 'deviantart:tag', label: 'Tag' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for journal page', () => {
      const value = 'https://deviantart.com/alice/journal'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=journal:alice',
          hint: { key: 'deviantart:journal', label: 'Journal' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated daily-deviations feed', () => {
      const value = 'https://deviantart.com/daily-deviations'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=special:dd',
          hint: { key: 'deviantart:daily-deviations', label: 'Daily Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated daily-deviations feed with a capitalized daily-deviations segment', () => {
      const value = 'https://deviantart.com/Daily-Deviations'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=special:dd',
          hint: { key: 'deviantart:daily-deviations', label: 'Daily Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated daily-deviations feed for trailing slash', () => {
      const value = 'https://deviantart.com/daily-deviations/'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=special:dd',
          hint: { key: 'deviantart:daily-deviations', label: 'Daily Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })
  })
})
