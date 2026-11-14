import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ComicfuryUrl, comicfuryHandler, parseComicfuryUrl } from './comicfury.js'

describe('parseComicfuryUrl', () => {
  const comicUrls: Array<string> = [
    'https://cardiac.thecomicseries.com/',
    'https://cardiac.thecomicstrip.org/',
    'https://cardiac.the-comic.org/comics/1',
    'https://cardiac.webcomic.ws/archive',
    'https://cardiac.cfw.me/',
  ]

  it.each(comicUrls)('should return the comic for %s', (url) => {
    const expected: ComicfuryUrl = { kind: 'comic', comic: 'cardiac' }

    expect(parseComicfuryUrl(url)).toEqual(expected)
  })

  it('should return the profile for a profile page', () => {
    const value = 'https://comicfury.com/comicprofile.php?url=spacecaptainpriya'
    const expected: ComicfuryUrl = { kind: 'profile', comic: 'spacecaptainpriya' }

    expect(parseComicfuryUrl(value)).toEqual(expected)
  })

  it('should return the reader for a reader page', () => {
    const value = 'https://comicfury.com/read/lurkinthedark/comics/1'
    const expected: ComicfuryUrl = { kind: 'reader', comic: 'lurkinthedark' }

    expect(parseComicfuryUrl(value)).toEqual(expected)
  })

  it('should return the reader on the www host', () => {
    const value = 'https://www.comicfury.com/read/lurkinthedark'
    const expected: ComicfuryUrl = { kind: 'reader', comic: 'lurkinthedark' }

    expect(parseComicfuryUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www subdomain of a comic domain', () => {
    expect(parseComicfuryUrl('https://www.thecomicseries.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain of a comic domain', () => {
    expect(parseComicfuryUrl('https://a.cardiac.thecomicseries.com/')).toBeUndefined()
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
    expect(parseComicfuryUrl('https://comicfury.com/forum/read/cardiac')).toBeUndefined()
  })

  it('should return undefined for a profile path below another segment', () => {
    const value = 'https://comicfury.com/forum/comicprofile.php?url=cardiac'

    expect(parseComicfuryUrl(value)).toBeUndefined()
  })

  it('should return undefined for another comicfury.com page', () => {
    expect(parseComicfuryUrl('https://comicfury.com/search.php')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseComicfuryUrl('https://example.com/read/cardiac')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseComicfuryUrl('not-a-url')).toBeUndefined()
  })
})

describe('comicfuryHandler', () => {
  describe('match', () => {
    it('should match a comic page', () => {
      expect(comicfuryHandler.match('https://cardiac.thecomicstrip.org/')).toBe(true)
    })

    it('should not match another host', () => {
      expect(comicfuryHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the comic feed on the comic domain', () => {
      const value = 'https://cardiac.thecomicstrip.org/comics/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://cardiac.thecomicstrip.org/rss',
          hint: { key: 'comicfury:comic', label: 'Comic' },
        },
      ]

      expect(comicfuryHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http comic page', () => {
      const value = 'http://alice.thecomicseries.com/comics/1'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.thecomicseries.com/rss',
          hint: { key: 'comicfury:comic', label: 'Comic' },
        },
      ]

      expect(comicfuryHandler.resolve(value)).toEqual(expected)
    })

    it('should return the comic feed on thecomicseries.com for a profile', () => {
      const value = 'https://comicfury.com/comicprofile.php?url=spacecaptainpriya'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://spacecaptainpriya.thecomicseries.com/rss',
          hint: { key: 'comicfury:comic', label: 'Comic' },
        },
      ]

      expect(comicfuryHandler.resolve(value)).toEqual(expected)
    })

    it('should return the reader feed for a reader page', () => {
      const value = 'https://comicfury.com/read/lurkinthedark/archive'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://comicfury.com/read/lurkinthedark/rss',
          hint: { key: 'comicfury:reader', label: 'Comic in the ComicFury reader' },
        },
      ]

      expect(comicfuryHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for a URL outside ComicFury', () => {
      expect(comicfuryHandler.resolve('https://example.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the comic hint for a comic feed', () => {
      const value = 'https://alice.thecomicseries.com/rss'
      const expected: DiscoverUriHint = { key: 'comicfury:comic', label: 'Comic' }

      expect(comicfuryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the comic hint for a comic feed with a trailing slash', () => {
      const value = 'https://alice.webcomic.ws/rss/'
      const expected: DiscoverUriHint = { key: 'comicfury:comic', label: 'Comic' }

      expect(comicfuryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the comic hint for a comic feed on cfw.me', () => {
      const value = 'https://alice.cfw.me/rss'
      const expected: DiscoverUriHint = { key: 'comicfury:comic', label: 'Comic' }

      expect(comicfuryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the reader hint for a reader feed', () => {
      const value = 'https://comicfury.com/read/alice/rss'
      const expected: DiscoverUriHint = {
        key: 'comicfury:reader',
        label: 'Comic in the ComicFury reader',
      }

      expect(comicfuryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the reader hint for a reader feed on the www host', () => {
      const value = 'https://www.comicfury.com/read/alice/rss'
      const expected: DiscoverUriHint = {
        key: 'comicfury:reader',
        label: 'Comic in the ComicFury reader',
      }

      expect(comicfuryHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a comic page', () => {
      const value = 'https://alice.thecomicseries.com/comics/1'

      expect(comicfuryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a reader page', () => {
      const value = 'https://comicfury.com/read/alice/archive'

      expect(comicfuryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a reader feed naming an invalid comic', () => {
      const value = 'https://comicfury.com/read/example.com/rss'

      expect(comicfuryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www subdomain of a comic domain', () => {
      const value = 'https://www.thecomicseries.com/rss'

      expect(comicfuryHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/rss'

      expect(comicfuryHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const comicHint: DiscoverUriHint = { key: 'comicfury:comic', label: 'Comic' }
    const readerHint: DiscoverUriHint = {
      key: 'comicfury:reader',
      label: 'Comic in the ComicFury reader',
    }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.thecomicseries.com/rss', comicHint],
      ['https://alice.thecomicseries.com/rss/', comicHint],
      ['https://alice.the-comic.org/rss/', comicHint],
      ['https://comicfury.com/read/alice/rss', readerHint],
      ['https://www.comicfury.com/read/alice/rss', readerHint],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [comicfuryHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
