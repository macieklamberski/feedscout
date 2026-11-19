import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { internetArchiveHandler } from './internetArchive.js'

const shellHtml = '<script type="module" src="/offshoot_assets/index.js"></script>'
const itemHtml = '<meta property="mediatype" content="audio">'

describe('internetArchiveHandler', () => {
  describe('match', () => {
    const collectionValues: Array<[boolean, string]> = [
      [true, 'https://archive.org/details/oldtimeradio'],
      [true, 'https://archive.org/details/oldtimeradio/'],
      [true, 'https://archive.org/details/oldtimeradio?tab=about'],
      [true, 'https://www.archive.org/details/oldtimeradio'],
      [true, 'https://archive.org/Details/oldtimeradio'],
      [true, 'https://archive.org/details/@alice'],
      [true, 'https://archive.org/details/@alice/uploads'],
      [false, 'https://archive.org/details/oldtimeradio/some-file'],
      [false, 'https://archive.org/details/'],
      [false, 'https://archive.org/'],
      [false, 'https://example.com/details/oldtimeradio'],
    ]

    it.each(collectionValues)('should return %s for %s with the app shell', (expected, url) => {
      expect(internetArchiveHandler.match(url, shellHtml)).toBe(expected)
    })

    const searchValues: Array<[boolean, string]> = [
      [true, 'https://archive.org/search?query=apollo'],
      [true, 'https://archive.org/Search?query=apollo'],
      [false, 'https://archive.org/search?query=apollo&sin=TXT'],
      [false, 'https://archive.org/search?query='],
      [false, 'https://archive.org/search'],
      [false, 'https://archive.org/searchable?query=apollo'],
    ]

    it.each(searchValues)('should return %s for %s', (expected, url) => {
      expect(internetArchiveHandler.match(url)).toBe(expected)
    })

    it('should not match an item page', () => {
      const value = 'https://archive.org/details/gd1977-05-08'

      expect(internetArchiveHandler.match(value, itemHtml)).toBe(false)
    })

    it('should not match a details page without content', () => {
      expect(internetArchiveHandler.match('https://archive.org/details/oldtimeradio')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(internetArchiveHandler.match('not-a-url', shellHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the bookmarks feed for an account page', () => {
      const value = 'https://archive.org/details/@alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://archive.org/bookmarks/alice?output=rss',
          hint: { key: 'internet-archive:bookmarks', label: 'Bookmarks' },
        },
      ]

      expect(internetArchiveHandler.resolve(value, shellHtml)).toEqual(expected)
    })

    it('should return the collection feed', () => {
      const value = 'https://archive.org/details/oldtimeradio'
      const expected = [
        {
          uri: 'https://archive.org/services/collection-rss.php?collection=oldtimeradio',
          hint: { key: 'internet-archive:collection', label: 'Collection' },
        },
        {
          uri: 'https://archive.org/iathreads/posts-display-new.php?forum=oldtimeradio&mode=rss',
          hint: { key: 'internet-archive:forum', label: 'Forum' },
        },
      ]

      expect(internetArchiveHandler.resolve(value, shellHtml)).toEqual(expected)
    })

    it('should keep the case of the collection identifier', () => {
      const value = 'https://archive.org/details/GratefulDead'
      const expected = [
        {
          uri: 'https://archive.org/services/collection-rss.php?collection=GratefulDead',
          hint: { key: 'internet-archive:collection', label: 'Collection' },
        },
        {
          uri: 'https://archive.org/iathreads/posts-display-new.php?forum=GratefulDead&mode=rss',
          hint: { key: 'internet-archive:forum', label: 'Forum' },
        },
      ]

      expect(internetArchiveHandler.resolve(value, shellHtml)).toEqual(expected)
    })

    it('should return the search feed', () => {
      const value =
        'https://archive.org/search?query=creator%3A%22Elf+Eldridge+and+Aimee+Whitcroft%22'
      const expected = [
        {
          uri: 'https://archive.org/services/collection-rss.php?query=creator:"Elf%20Eldridge%20and%20Aimee%20Whitcroft"',
          hint: { key: 'internet-archive:search', label: 'Search' },
        },
      ]

      expect(internetArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should write a colon in the search query as is', () => {
      const value = 'https://archive.org/search?query=subject%3AEqualizing-X-Distort'
      const expected = [
        {
          uri: 'https://archive.org/services/collection-rss.php?query=subject:Equalizing-X-Distort',
          hint: { key: 'internet-archive:search', label: 'Search' },
        },
      ]

      expect(internetArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should write a space in the search query as %20', () => {
      const value = 'https://archive.org/search?query=apollo+11'
      const expected = [
        {
          uri: 'https://archive.org/services/collection-rss.php?query=apollo%2011',
          hint: { key: 'internet-archive:search', label: 'Search' },
        },
      ]

      expect(internetArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for an item page', () => {
      const value = 'https://archive.org/details/gd1977-05-08'

      expect(internetArchiveHandler.resolve(value, itemHtml)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the collection hint for a collection feed on the cors host', () => {
      const value = 'https://cors.archive.org/services/collection-rss.php?collection=Film_Noir'
      const expected: DiscoverUriHint = { key: 'internet-archive:collection', label: 'Collection' }

      expect(internetArchiveHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the media type hint for a media type feed', () => {
      const value = 'http://archive.org/services/collection-rss.php?mediatype=audio'
      const expected: DiscoverUriHint = { key: 'internet-archive:mediatype', label: 'Media type' }

      expect(internetArchiveHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a collection feed on the cors host as itself', async () => {
      const value = 'https://cors.archive.org/services/collection-rss.php?collection=Film_Noir'
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'internet-archive:collection', label: 'Collection' } },
      ]
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [internetArchiveHandler],
        baseUrl: value,
      })

      expect(result).toEqual(expected)
    })
  })
})
