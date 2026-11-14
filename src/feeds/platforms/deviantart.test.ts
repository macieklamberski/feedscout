import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { DeviantartUrl } from './deviantart.js'
import { deviantartHandler, parseDeviantartUrl } from './deviantart.js'

describe('parseDeviantartUrl', () => {
  it('should return the profile for a profile page', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'yuumei' }

    expect(parseDeviantartUrl('https://deviantart.com/yuumei')).toEqual(expected)
  })

  it('should return the profile for the www host', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'yuumei' }

    expect(parseDeviantartUrl('https://www.deviantart.com/yuumei')).toEqual(expected)
  })

  it('should return the profile for a profile page with a trailing slash', () => {
    const expected: DeviantartUrl = { kind: 'profile', username: 'yuumei' }

    expect(parseDeviantartUrl('https://www.deviantart.com/yuumei/')).toEqual(expected)
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
    const expected: DeviantartUrl = { kind: 'profile', username: 'yuumei' }

    expect(parseDeviantartUrl('https://www.deviantart.com/yuumei/gallery')).toEqual(expected)
    expect(parseDeviantartUrl('https://deviantart.com/yuumei/gallery/all')).toEqual(expected)
  })

  it('should return the author profile for a deviation page', () => {
    const value = 'https://www.deviantart.com/yuumei/art/some-art-123'
    const expected: DeviantartUrl = { kind: 'profile', username: 'yuumei' }

    expect(parseDeviantartUrl(value)).toEqual(expected)
  })

  it('should return the folder for a gallery folder page', () => {
    const value = 'https://deviantart.com/yuumei/gallery/123456/folder-name'
    const expected: DeviantartUrl = { kind: 'folder', username: 'yuumei', folderId: '123456' }

    expect(parseDeviantartUrl(value)).toEqual(expected)
  })

  it('should return the folder for a gallery folder page with a capitalized gallery segment', () => {
    const value = 'https://deviantart.com/yuumei/Gallery/123456/folder-name'
    const expected: DeviantartUrl = { kind: 'folder', username: 'yuumei', folderId: '123456' }

    expect(parseDeviantartUrl(value)).toEqual(expected)
  })

  it('should return the favourites for a favourites page', () => {
    const expected: DeviantartUrl = { kind: 'favourites', username: 'yuumei' }

    expect(parseDeviantartUrl('https://deviantart.com/yuumei/favourites')).toEqual(expected)
  })

  it('should return the favourites for a favourites page with a capitalized favourites segment', () => {
    const expected: DeviantartUrl = { kind: 'favourites', username: 'yuumei' }

    expect(parseDeviantartUrl('https://deviantart.com/yuumei/Favourites')).toEqual(expected)
  })

  it('should return the journal for a journal page', () => {
    const expected: DeviantartUrl = { kind: 'journal', username: 'yuumei' }

    expect(parseDeviantartUrl('https://deviantart.com/yuumei/journal')).toEqual(expected)
  })

  it('should return the journal for a journal page with a capitalized journal segment', () => {
    const expected: DeviantartUrl = { kind: 'journal', username: 'yuumei' }

    expect(parseDeviantartUrl('https://deviantart.com/yuumei/Journal')).toEqual(expected)
  })

  it('should return the journal for a journal post', () => {
    const value = 'https://deviantart.com/yuumei/journal/some-post-slug'
    const expected: DeviantartUrl = { kind: 'journal', username: 'yuumei' }

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
    expect(parseDeviantartUrl('https://example.com/yuumei')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDeviantartUrl('not-a-url')).toBeUndefined()
  })
})

describe('deviantartHandler', () => {
  describe('match', () => {
    it('should match DeviantArt URLs', () => {
      expect(deviantartHandler.match('https://www.deviantart.com/yuumei')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(deviantartHandler.match('https://example.com/yuumei')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed URL for user profile', () => {
      const value = 'https://deviantart.com/yuumei'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=by:yuumei%20sort:time%20meta:all',
          hint: { key: 'deviantart:deviations', label: 'Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for specific gallery folder', () => {
      const value = 'https://deviantart.com/yuumei/gallery/123456/folder-name'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery:yuumei/123456',
          hint: { key: 'deviantart:gallery', label: 'Gallery' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for favourites', () => {
      const value = 'https://deviantart.com/yuumei/favourites'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=favby:yuumei',
          hint: { key: 'deviantart:favorites', label: 'Favorites' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for tag page', () => {
      const value = 'https://deviantart.com/tag/photography'

      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should return RSS feed URL for journal page', () => {
      const value = 'https://deviantart.com/yuumei/journal'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=journal&q=by:yuumei',
          hint: { key: 'deviantart:journal', label: 'Journal' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the daily deviations page', () => {
      const value = 'https://deviantart.com/daily-deviations'

      expect(deviantartHandler.resolve(value)).toEqual([])
    })

    it('should return no feeds for a page outside DeviantArt', () => {
      const value = 'https://www.artstation.com/yuumei'
      const expected: Array<DiscoverUriEntry> = []

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the deviations hint for an encoded deviations feed', () => {
      const value =
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aaditya777%20sort%3Atime%20meta%3Aall'
      const expected: DiscoverUriHint = { key: 'deviantart:deviations', label: 'Deviations' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the deviations hint for a plain deviations feed', () => {
      const value =
        'https://backend.deviantart.com/rss.xml?type=deviation&q=by:yuumei%20sort:time%20meta:all'
      const expected: DiscoverUriHint = { key: 'deviantart:deviations', label: 'Deviations' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the deviations hint for a deviations feed with the parameters reordered', () => {
      const value =
        'https://backend.deviantart.com/rss.xml?q=by%3Aadochka%20sort%3Atime%20meta%3Aall&type=deviation'
      const expected: DiscoverUriHint = { key: 'deviantart:deviations', label: 'Deviations' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the gallery hint for an encoded gallery feed', () => {
      const value =
        'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery%3Ahanciong%2F30811007'
      const expected: DiscoverUriHint = { key: 'deviantart:gallery', label: 'Gallery' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the gallery hint for a plain gallery feed', () => {
      const value =
        'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery:smashifiedart/54361670'
      const expected: DiscoverUriHint = { key: 'deviantart:gallery', label: 'Gallery' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the favorites hint for an encoded favorites feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?type=deviation&q=favby%3Akristarella'
      const expected: DiscoverUriHint = { key: 'deviantart:favorites', label: 'Favorites' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the favorites hint for a plain favorites feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?type=deviation&q=favby:jakubprzybylski'
      const expected: DiscoverUriHint = { key: 'deviantart:favorites', label: 'Favorites' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for an encoded tag feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag%3Aaliens'
      const expected: DiscoverUriHint = { key: 'deviantart:tag', label: 'Tag' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a plain tag feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag:green'
      const expected: DiscoverUriHint = { key: 'deviantart:tag', label: 'Tag' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the journal hint for a plain journal feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?type=journal&q=by:alice'
      const expected: DiscoverUriHint = { key: 'deviantart:journal', label: 'Journal' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the journal query that serves the Popular feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?q=journal:alice'

      expect(deviantartHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an encoded journal query with the deviation type', () => {
      const value = 'https://backend.deviantart.com/rss.xml?type=deviation&q=journal%3Aalice'

      expect(deviantartHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the daily deviations hint for the daily deviations feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?q=special:dd'
      const expected: DiscoverUriHint = {
        key: 'deviantart:daily-deviations',
        label: 'Daily Deviations',
      }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the daily deviations hint for an encoded daily deviations feed', () => {
      const value = 'https://backend.deviantart.com/rss.xml?q=special%3Add'
      const expected: DiscoverUriHint = {
        key: 'deviantart:daily-deviations',
        label: 'Daily Deviations',
      }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a tag feed without the deviation type', () => {
      const value = 'https://backend.deviantart.com/rss.xml?q=tag:aliens'

      expect(deviantartHandler.getFeedHint?.(value)).toBeUndefined()
    })

    const deviationsSpellings: Array<string> = [
      'https://backend.deviantart.com/rss.xml?type=deviation&q=by:alice',
      'https://backend.deviantart.com/rss.xml?q=by%3Aalice&type=gallery',
      'https://backend.deviantart.com/rss.xml?order=5&q=by%3Aalice',
      'https://backend.deviantart.com/rss.xml?q=gallery%3Aalice',
    ]

    it.each(deviationsSpellings)('should return the deviations hint for %s', (value) => {
      const expected: DiscoverUriHint = { key: 'deviantart:deviations', label: 'Deviations' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the journal hint for a journal feed of the by query', () => {
      const value = 'https://backend.deviantart.com/rss.xml?formatted=1&q=by%3Aalice&type=journal'
      const expected: DiscoverUriHint = { key: 'deviantart:journal', label: 'Journal' }

      expect(deviantartHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for the feed path on the www host', () => {
      const value = 'https://www.deviantart.com/rss.xml?type=deviation&q=tag:aliens'

      expect(deviantartHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a profile page', () => {
      const value = 'https://www.deviantart.com/yuumei'

      expect(deviantartHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const ownFeeds: Array<[string, string, string]> = [
    [
      'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Aaditya777%20sort%3Atime%20meta%3Aall',
      'deviantart:deviations',
      'Deviations',
    ],
    [
      'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery%3Ahanciong%2F30811007',
      'deviantart:gallery',
      'Gallery',
    ],
    [
      'https://backend.deviantart.com/rss.xml?type=deviation&q=favby%3Akristarella',
      'deviantart:favorites',
      'Favorites',
    ],
    [
      'https://backend.deviantart.com/rss.xml?type=deviation&q=tag%3Aaliens',
      'deviantart:tag',
      'Tag',
    ],
    [
      'https://backend.deviantart.com/rss.xml?q=special:dd',
      'deviantart:daily-deviations',
      'Daily Deviations',
    ],
    [
      'http://backend.deviantart.com/rss.xml?q=by%3Aalice&type=gallery',
      'deviantart:deviations',
      'Deviations',
    ],
    [
      'https://backend.deviantart.com/rss.xml?q=by%3Aalice&type=journal',
      'deviantart:journal',
      'Journal',
    ],
  ]

  it.each(ownFeeds)('should return %s itself as %s', async (value, key, label) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [deviantartHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [{ uri: value, hint: { key, label } }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
