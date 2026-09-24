import { describe, expect, it } from 'bun:test'
import { hatenaBookmarkHandler } from './hatenaBookmark.js'

const base = 'https://b.hatena.ne.jp'

describe('hatenaBookmarkHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://b.hatena.ne.jp'],
      [true, 'https://b.hatena.ne.jp/hotentry/it'],
      [false, 'https://hatena.ne.jp'],
      [false, 'https://b.hatena.ne.jp.example.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(hatenaBookmarkHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(hatenaBookmarkHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    const hotEntries = [
      { uri: `${base}/hotentry.rss`, hint: { key: 'hatena-bookmark:hot', label: 'Hot entries' } },
    ]

    it('should return hot entries for the homepage', () => {
      expect(hatenaBookmarkHandler.resolve(base)).toEqual(hotEntries)
    })

    it('should return hot entries for the hotentry page', () => {
      expect(hatenaBookmarkHandler.resolve(`${base}/hotentry`)).toEqual(hotEntries)
    })

    it('should return hot entries for a category page', () => {
      const expected = [
        {
          uri: `${base}/hotentry/it.rss`,
          hint: { key: 'hatena-bookmark:hot', label: 'Hot entries' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/hotentry/it`)).toEqual(expected)
    })

    it('should return new entries for the entrylist page', () => {
      const expected = [
        {
          uri: `${base}/entrylist.rss`,
          hint: { key: 'hatena-bookmark:new', label: 'New entries' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/entrylist`)).toEqual(expected)
    })

    it('should return new entries for a category page', () => {
      const expected = [
        {
          uri: `${base}/entrylist/game.rss`,
          hint: { key: 'hatena-bookmark:new', label: 'New entries' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/entrylist/game`)).toEqual(expected)
    })

    it('should return a search feed for a tag search', () => {
      const expected = [
        {
          uri: `${base}/search/tag?q=rss&mode=rss`,
          hint: { key: 'hatena-bookmark:search', label: 'Search' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/search/tag?q=rss`)).toEqual(expected)
    })

    it('should keep existing search filters', () => {
      const expected = [
        {
          uri: `${base}/search/text?q=feed&users=3&mode=rss`,
          hint: { key: 'hatena-bookmark:search', label: 'Search' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/search/text?q=feed&users=3`)).toEqual(expected)
    })

    it('should return a site feed for a domain page', () => {
      const expected = [
        {
          uri: `${base}/site/example.com?mode=rss`,
          hint: { key: 'hatena-bookmark:site', label: 'Site' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/site/example.com`)).toEqual(expected)
    })

    const userBookmarks = [
      {
        uri: `${base}/mizdra/bookmark.rss`,
        hint: { key: 'hatena-bookmark:bookmarks', label: 'Bookmarks' },
      },
    ]

    it('should return bookmarks for a user page', () => {
      expect(hatenaBookmarkHandler.resolve(`${base}/mizdra/`)).toEqual(userBookmarks)
    })

    it('should return bookmarks for a user bookmark page', () => {
      expect(hatenaBookmarkHandler.resolve(`${base}/mizdra/bookmark`)).toEqual(userBookmarks)
    })

    it('should not treat a site section as a username', () => {
      expect(hatenaBookmarkHandler.resolve(`${base}/entry/12345`)).toEqual(hotEntries)
    })
  })
})
