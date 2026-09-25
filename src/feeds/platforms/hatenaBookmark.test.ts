import { describe, expect, it } from 'bun:test'
import type { HatenaBookmarkUrl } from './hatenaBookmark.js'
import { hatenaBookmarkHandler, parseHatenaBookmarkUrl } from './hatenaBookmark.js'

const base = 'https://b.hatena.ne.jp'

describe('parseHatenaBookmarkUrl', () => {
  it('should return a search for a tag search', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/tag?q=rss')).toEqual(expected)
  })

  it('should return a search for a tag search with a capitalized search segment', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Search/tag?q=rss')).toEqual(expected)
  })

  it('should return a search for a text search', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/text?q=feed')).toEqual(expected)
  })

  it('should return a site for a domain page', () => {
    const expected: HatenaBookmarkUrl = { kind: 'site' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/site/example.com/')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'jkondo' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/jkondo/')).toEqual(expected)
  })

  it('should return the user for a user page without a trailing slash', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'jkondo' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/jkondo')).toEqual(expected)
  })

  it('should return the user for a user subpage', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'jkondo' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/jkondo/bookmark')).toEqual(expected)
  })

  it('should return a user ID with hyphens and underscores', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'web-dev_jp' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/web-dev_jp/')).toEqual(expected)
  })

  it('should keep the user ID case', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'JKondo' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/JKondo')).toEqual(expected)
  })

  it('should return the user for a user feed URL', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'jkondo' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/jkondo.rss')).toEqual(expected)
  })

  it('should return undefined for the site-wide entry lists', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/hotentry/it')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/entrylist')).toBeUndefined()
  })

  it('should return undefined for a site section', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/guide/')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/entry/12345')).toBeUndefined()
  })

  it('should return undefined for files at the root', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/favicon.ico')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/hotentry.rss')).toBeUndefined()
  })

  it('should return undefined for a path shorter than a Hatena ID', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/rss')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/ab')).toBeUndefined()
  })

  it('should return undefined for a path starting with a non-letter', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/-/my/config')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/1abc')).toBeUndefined()
  })

  it('should return undefined for a path ending with a hyphen', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/abc-')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHatenaBookmarkUrl('https://hatena.ne.jp/jkondo')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp.example.com/jkondo')).toBeUndefined()
    expect(parseHatenaBookmarkUrl('https://example.com/jkondo')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseHatenaBookmarkUrl('not-a-url')).toBeUndefined()
  })
})

describe('hatenaBookmarkHandler', () => {
  describe('match', () => {
    it('should match a Hatena Bookmark URL', () => {
      expect(hatenaBookmarkHandler.match('https://b.hatena.ne.jp')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(hatenaBookmarkHandler.match('https://example.com')).toBe(false)
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

    it('should return the canonical search feed for a capitalized search path', () => {
      const expected = [
        {
          uri: `${base}/search/tag?q=rss&mode=rss`,
          hint: { key: 'hatena-bookmark:search', label: 'Search' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/Search/Tag?q=rss`)).toEqual(expected)
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
  })
})
