import { describe, expect, it } from 'bun:test'
import type { DeviantartUrl } from './deviantart.js'
import { deviantartHandler, parseDeviantartUrl } from './deviantart.js'

describe('parseDeviantartUrl', () => {
  const excludedValues: Array<string> = [
    'https://deviantart.com/about',
    'https://deviantart.com/join',
    'https://deviantart.com/search',
    'https://deviantart.com/shop',
    'https://deviantart.com/about/gallery/123456/folder-name',
    'https://deviantart.com/about/favourites',
    'https://deviantart.com/about/journal',
  ]

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

  it('should return the journal for a journal page', () => {
    const expected: DeviantartUrl = { kind: 'journal', username: 'yuumei' }

    expect(parseDeviantartUrl('https://deviantart.com/yuumei/journal')).toEqual(expected)
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

  it('should decode a percent-encoded tag', () => {
    const expected: DeviantartUrl = { kind: 'tag', tag: 'café' }

    expect(parseDeviantartUrl('https://deviantart.com/tag/caf%C3%A9')).toEqual(expected)
  })

  it.each(excludedValues)('should return undefined for %s', (value) => {
    expect(parseDeviantartUrl(value)).toBeUndefined()
  })

  it('should return undefined for the tag prefix without a tag', () => {
    expect(parseDeviantartUrl('https://www.deviantart.com/tag')).toBeUndefined()
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
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=by%3Ayuumei%20sort%3Atime%20meta%3Aall',
          hint: { key: 'deviantart:deviations', label: 'Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for specific gallery folder', () => {
      const value = 'https://deviantart.com/yuumei/gallery/123456/folder-name'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=gallery%3Ayuumei%2F123456',
          hint: { key: 'deviantart:gallery', label: 'Gallery' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for favourites', () => {
      const value = 'https://deviantart.com/yuumei/favourites'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=favby%3Ayuumei',
          hint: { key: 'deviantart:favorites', label: 'Favorites' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for tag page', () => {
      const value = 'https://deviantart.com/tag/photography'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag%3Aphotography',
          hint: { key: 'deviantart:tag', label: 'Tag' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a percent-encoded tag encoded once', () => {
      const value = 'https://deviantart.com/tag/caf%C3%A9'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=tag%3Acaf%C3%A9',
          hint: { key: 'deviantart:tag', label: 'Tag' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed URL for journal page', () => {
      const value = 'https://deviantart.com/yuumei/journal'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=journal%3Ayuumei',
          hint: { key: 'deviantart:journal', label: 'Journal' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated daily-deviations feed', () => {
      const value = 'https://deviantart.com/daily-deviations'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=special%3Add',
          hint: { key: 'deviantart:daily-deviations', label: 'Daily Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return popular feed', () => {
      const value = 'https://deviantart.com/popular'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=boost%3Apopular',
          hint: { key: 'deviantart:popular', label: 'Popular' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated daily-deviations feed for trailing slash', () => {
      const value = 'https://deviantart.com/daily-deviations/'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?q=special%3Add',
          hint: { key: 'deviantart:daily-deviations', label: 'Daily Deviations' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return popular feed for trailing slash', () => {
      const value = 'https://deviantart.com/popular/'
      const expected = [
        {
          uri: 'https://backend.deviantart.com/rss.xml?type=deviation&q=boost%3Apopular',
          hint: { key: 'deviantart:popular', label: 'Popular' },
        },
      ]

      expect(deviantartHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a page without a feed', () => {
      expect(deviantartHandler.resolve('https://deviantart.com/about')).toEqual([])
    })
  })
})
