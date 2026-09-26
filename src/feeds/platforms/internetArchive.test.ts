import { describe, expect, it } from 'bun:test'
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
      [false, 'https://archive.org/details/@alice'],
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
    it('should return the collection feed', () => {
      const value = 'https://archive.org/details/oldtimeradio'
      const expected = [
        {
          uri: 'https://archive.org/services/collection-rss.php?collection=oldtimeradio',
          hint: { key: 'internet-archive:collection', label: 'Collection' },
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
      ]

      expect(internetArchiveHandler.resolve(value, shellHtml)).toEqual(expected)
    })

    it('should return the search feed', () => {
      const value = 'https://archive.org/search?query=subject%3A%22apollo+11%22'
      const expected = [
        {
          uri: 'https://archive.org/services/collection-rss.php?query=subject%3A%22apollo+11%22',
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
})
