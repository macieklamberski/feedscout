import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type ComicfuryUrl, comicfuryHandler, parseComicfuryUrl } from './comicfury.js'

describe('parseComicfuryUrl', () => {
  const comicUrls: Array<string> = [
    'https://carolcomic.thecomicseries.com/',
    'https://carolcomic.thecomicstrip.org/',
    'https://carolcomic.the-comic.org/comics/1',
    'https://carolcomic.webcomic.ws/archive',
    'https://carolcomic.cfw.me/',
  ]

  it.each(comicUrls)('should return the comic for %s', (url) => {
    const expected: ComicfuryUrl = { kind: 'comic', comic: 'carolcomic' }

    expect(parseComicfuryUrl(url)).toEqual(expected)
  })

  it('should return the profile for a profile page', () => {
    const value = 'https://comicfury.com/comicprofile.php?url=bobcomic'
    const expected: ComicfuryUrl = { kind: 'profile', comic: 'bobcomic' }

    expect(parseComicfuryUrl(value)).toEqual(expected)
  })

  it('should return the reader for a reader page', () => {
    const value = 'https://comicfury.com/read/alicecomic/comics/1'
    const expected: ComicfuryUrl = { kind: 'reader', comic: 'alicecomic' }

    expect(parseComicfuryUrl(value)).toEqual(expected)
  })

  it('should return the reader on the www host', () => {
    const value = 'https://www.comicfury.com/read/alicecomic'
    const expected: ComicfuryUrl = { kind: 'reader', comic: 'alicecomic' }

    expect(parseComicfuryUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www subdomain of a comic domain', () => {
    expect(parseComicfuryUrl('https://www.thecomicseries.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain of a comic domain', () => {
    expect(parseComicfuryUrl('https://a.carolcomic.thecomicseries.com/')).toBeUndefined()
  })

  it('should return undefined for a profile page without a comic', () => {
    expect(parseComicfuryUrl('https://comicfury.com/comicprofile.php')).toBeUndefined()
  })

  it('should return undefined for a profile page naming an invalid comic', () => {
    const value = 'https://comicfury.com/comicprofile.php?url=example.com%2Fpath'

    expect(parseComicfuryUrl(value)).toBeUndefined()
  })

  it('should return undefined for a reader page naming an invalid comic', () => {
    expect(parseComicfuryUrl('https://comicfury.com/read/example.com')).toBeUndefined()
  })

  it('should return undefined for a reader path below another segment', () => {
    expect(parseComicfuryUrl('https://comicfury.com/forum/read/carolcomic')).toBeUndefined()
  })

  it('should return undefined for a profile path below another segment', () => {
    const value = 'https://comicfury.com/forum/comicprofile.php?url=carolcomic'

    expect(parseComicfuryUrl(value)).toBeUndefined()
  })

  it('should return undefined for another comicfury.com page', () => {
    expect(parseComicfuryUrl('https://comicfury.com/search.php')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseComicfuryUrl('https://example.com/read/carolcomic')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseComicfuryUrl('not-a-url')).toBeUndefined()
  })
})

describe('comicfuryHandler', () => {
  describe('match', () => {
    it('should match a comic page', () => {
      expect(comicfuryHandler.match('https://carolcomic.thecomicstrip.org/')).toBe(true)
    })

    it('should not match another host', () => {
      expect(comicfuryHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the comic feed on the comic domain', () => {
      const value = 'https://carolcomic.thecomicstrip.org/comics/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://carolcomic.thecomicstrip.org/rss',
          hint: { key: 'comicfury:comic', label: 'Comic' },
        },
      ]

      expect(comicfuryHandler.resolve(value)).toEqual(expected)
    })

    it('should return the comic feed on thecomicseries.com for a profile', () => {
      const value = 'https://comicfury.com/comicprofile.php?url=bobcomic'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bobcomic.thecomicseries.com/rss',
          hint: { key: 'comicfury:comic', label: 'Comic' },
        },
      ]

      expect(comicfuryHandler.resolve(value)).toEqual(expected)
    })

    it('should return the reader feed for a reader page', () => {
      const value = 'https://comicfury.com/read/alicecomic/archive'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://comicfury.com/read/alicecomic/rss',
          hint: { key: 'comicfury:reader', label: 'Comic in the ComicFury reader' },
        },
      ]

      expect(comicfuryHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for a URL outside ComicFury', () => {
      expect(comicfuryHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
