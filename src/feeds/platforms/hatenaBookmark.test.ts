import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { HatenaBookmarkUrl } from './hatenaBookmark.js'
import { hatenaBookmarkHandler, parseHatenaBookmarkUrl } from './hatenaBookmark.js'

const base = 'https://b.hatena.ne.jp'

describe('parseHatenaBookmarkUrl', () => {
  const home: HatenaBookmarkUrl = { kind: 'home' }

  it('should return a search for a query page', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/rss')).toEqual(expected)
  })

  it('should return a search for a query page with a capitalized q segment', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Q/rss')).toEqual(expected)
  })

  it('should return the decoded query for an encoded query page', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'c++ web', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/c%2B%2B%20web')).toEqual(expected)
  })

  it('should keep a slash in the query', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss/atom', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/rss/atom')).toEqual(expected)
  })

  it('should keep the search filters of a query page', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'rss',
      params: { target: 'title', sort: 'recent', users: '10', date_range: '1w', safe: 'on' },
    }
    const url =
      'https://b.hatena.ne.jp/q/rss?target=title&sort=recent&users=10&date_range=1w&safe=on'

    expect(parseHatenaBookmarkUrl(url)).toEqual(expected)
  })

  it('should drop the page and unknown parameters of a query page', () => {
    const value = 'https://b.hatena.ne.jp/q/rss?target=text&page=2&ref=top'
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: { target: 'text' } }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return the home page for a query page without a query', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/q/')).toEqual(home)
  })

  it('should return a search without a target for an old tag search', () => {
    const expected: HatenaBookmarkUrl = { kind: 'search', query: 'rss', params: {} }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/tag?q=rss')).toEqual(expected)
  })

  it('should return a search with a target for an old text search', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'feed',
      params: { target: 'text' },
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/text?q=feed')).toEqual(expected)
  })

  it('should return the lowercase target for a capitalized old search type', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'rss',
      params: { target: 'title' },
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Search/Title?q=rss')).toEqual(expected)
  })

  it('should keep the search filters of an old search', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'search',
      query: 'feed',
      params: { target: 'text', users: '3' },
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/text?q=feed&users=3')).toEqual(
      expected,
    )
  })

  it('should return the home page for an old search without a query', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/search/tag')).toEqual(home)
  })

  it('should return a site for a domain page', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'site',
      site: 'example.com/',
      params: {},
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/site/example.com/')).toEqual(expected)
  })

  it('should keep only the sort order of a site page', () => {
    const value = 'https://b.hatena.ne.jp/site/example.com/?page=2&sort=eid'
    const expected: HatenaBookmarkUrl = {
      kind: 'site',
      site: 'example.com/',
      params: { sort: 'eid' },
    }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return a site for a domain page with a capitalized site segment', () => {
    const expected: HatenaBookmarkUrl = {
      kind: 'site',
      site: 'example.com/',
      params: {},
    }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Site/example.com/')).toEqual(expected)
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

  it('should return the user for a user feed URL with a capitalized rss extension', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'jkondo' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/jkondo.RSS')).toEqual(expected)
  })

  it('should return the hot entries of a category', () => {
    const expected: HatenaBookmarkUrl = { kind: 'hotentry', category: 'it' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/hotentry/it')).toEqual(expected)
  })

  it('should return the hot entries without an unknown category', () => {
    const expected: HatenaBookmarkUrl = { kind: 'hotentry', category: undefined }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/Hotentry/nope')).toEqual(expected)
  })

  it('should return the hot entries without a category for the all category', () => {
    const value = 'https://b.hatena.ne.jp/hotentry/all'
    const expected: HatenaBookmarkUrl = { kind: 'hotentry', category: undefined }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return the new entries', () => {
    const expected: HatenaBookmarkUrl = { kind: 'entrylist', category: undefined }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/entrylist')).toEqual(expected)
  })

  it('should return the home page for files at the root', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/favicon.ico')).toEqual(home)
  })

  it('should return the user for a two-letter path', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'ab' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/ab')).toEqual(expected)
  })

  it('should return the user for a path longer than 32 characters', () => {
    const value = 'https://b.hatena.ne.jp/abcdefghijklmnopqrstuvwxyzabcdefghijklmn/'
    const expected: HatenaBookmarkUrl = {
      kind: 'user',
      username: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmn',
    }

    expect(parseHatenaBookmarkUrl(value)).toEqual(expected)
  })

  it('should return the home page for a path starting with a non-letter', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/-/my/config')).toEqual(home)
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/1abc')).toEqual(home)
  })

  it('should return the user for a path ending with a hyphen', () => {
    const expected: HatenaBookmarkUrl = { kind: 'user', username: 'abc-' }

    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/abc-')).toEqual(expected)
  })

  it('should return the home page for the homepage', () => {
    expect(parseHatenaBookmarkUrl('https://b.hatena.ne.jp/')).toEqual(home)
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
    it('should return empty array for a URL outside Hatena Bookmark', () => {
      expect(hatenaBookmarkHandler.resolve('https://example.com/')).toEqual([])
    })

    const hotEntries: Array<DiscoverUriEntry> = [
      { uri: `${base}/hotentry.rss`, hint: { key: 'hatena-bookmark:hot', label: 'Hot entries' } },
    ]

    it('should return hot entries for the homepage', () => {
      expect(hatenaBookmarkHandler.resolve(base)).toEqual(hotEntries)
    })

    it('should return hot entries for the hotentry page', () => {
      expect(hatenaBookmarkHandler.resolve(`${base}/hotentry`)).toEqual(hotEntries)
    })

    it('should return hot entries in category for a category page', () => {
      const value = `${base}/hotentry/it`
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${base}/hotentry/it.rss`,
          hint: { key: 'hatena-bookmark:hot-category', label: 'Hot entries in category' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
    })

    it('should return lowercase hot entries in category for a capitalized category page', () => {
      const value = `${base}/Hotentry/IT`
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${base}/hotentry/it.rss`,
          hint: { key: 'hatena-bookmark:hot-category', label: 'Hot entries in category' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
    })

    it('should return hot entries for the all category page', () => {
      const value = `${base}/hotentry/all`
      const expected: Array<DiscoverUriEntry> = [
        { uri: `${base}/hotentry.rss`, hint: { key: 'hatena-bookmark:hot', label: 'Hot entries' } },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
    })

    it('should return hot entries for an unknown category page', () => {
      expect(hatenaBookmarkHandler.resolve(`${base}/hotentry/Foo`)).toEqual(hotEntries)
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

    it('should return new entries in category for a category page', () => {
      const value = `${base}/entrylist/game`
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${base}/entrylist/game.rss`,
          hint: { key: 'hatena-bookmark:new-category', label: 'New entries in category' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
    })

    it('should return new entries for the all category page', () => {
      const value = `${base}/entrylist/all`
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${base}/entrylist.rss`,
          hint: { key: 'hatena-bookmark:new', label: 'New entries' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
    })

    it('should return a search feed for a query page', () => {
      const expected = [
        {
          uri: `${base}/q/c++%20web?target=title&mode=rss`,
          hint: { key: 'hatena-bookmark:search', label: 'Search' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/q/c%2B%2B%20web?target=title`)).toEqual(
        expected,
      )
    })

    it('should write a colon in the query as is', () => {
      const expected = [
        {
          uri: `${base}/q/Re:Zero?mode=rss`,
          hint: { key: 'hatena-bookmark:search', label: 'Search' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/q/Re%3AZero`)).toEqual(expected)
    })

    it('should write an at sign in the query as is', () => {
      const expected = [
        {
          uri: `${base}/q/@nifty?mode=rss`,
          hint: { key: 'hatena-bookmark:search', label: 'Search' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(`${base}/q/%40nifty`)).toEqual(expected)
    })

    it('should write a non-ASCII query as is', () => {
      const value = `${base}/q/%E3%82%BB%E3%82%AD%E3%83%A5%E3%83%AA%E3%83%86%E3%82%A3`
      const expected = [
        {
          uri: `${base}/q/セキュリティ?mode=rss`,
          hint: { key: 'hatena-bookmark:search', label: 'Search' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
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

    const userBookmarks: Array<DiscoverUriEntry> = [
      {
        uri: `${base}/mizdra/bookmark.rss`,
        hint: { key: 'hatena-bookmark:bookmarks', label: 'Bookmarks' },
      },
    ]

    it('should return bookmarks for a user page', () => {
      expect(hatenaBookmarkHandler.resolve(`${base}/mizdra/`)).toEqual(userBookmarks)
    })

    it('should return an https feed for an http page', () => {
      const value = 'http://b.hatena.ne.jp/hotentry/it'
      const expected = [
        {
          uri: `${base}/hotentry/it.rss`,
          hint: { key: 'hatena-bookmark:hot-category', label: 'Hot entries in category' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
    })

    it('should return an https site feed for an http site page', () => {
      const value = 'http://b.hatena.ne.jp/site/example.com'
      const expected = [
        {
          uri: `${base}/site/example.com?mode=rss`,
          hint: { key: 'hatena-bookmark:site', label: 'Site' },
        },
      ]

      expect(hatenaBookmarkHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const ownFeedHints: Array<[string, DiscoverUriHint]> = [
      ['https://b.hatena.ne.jp/hotentry.rss', { key: 'hatena-bookmark:hot', label: 'Hot entries' }],
      [
        'https://b.hatena.ne.jp/hotentry/all.rss',
        { key: 'hatena-bookmark:hot', label: 'Hot entries' },
      ],
      [
        'https://b.hatena.ne.jp/hotentry/life.rss',
        { key: 'hatena-bookmark:hot-category', label: 'Hot entries in category' },
      ],
      [
        'https://b.hatena.ne.jp/entrylist.rss',
        { key: 'hatena-bookmark:new', label: 'New entries' },
      ],
      [
        'https://b.hatena.ne.jp/entrylist/all.rss',
        { key: 'hatena-bookmark:new', label: 'New entries' },
      ],
      [
        'https://b.hatena.ne.jp/entrylist/entertainment.rss',
        { key: 'hatena-bookmark:new-category', label: 'New entries in category' },
      ],
      [
        'https://b.hatena.ne.jp/q/%E8%A1%8C%E6%94%BF?mode=rss',
        { key: 'hatena-bookmark:search', label: 'Search' },
      ],
      [
        'https://b.hatena.ne.jp/q/セキュリティ?mode=rss',
        { key: 'hatena-bookmark:search', label: 'Search' },
      ],
      [
        'https://b.hatena.ne.jp/q/c++%20web?target=title&mode=rss',
        { key: 'hatena-bookmark:search', label: 'Search' },
      ],
      [
        'https://b.hatena.ne.jp/q/rpg?date_range=5y&mode=rss&safe=on&sort=recent&target=tag&users=5',
        { key: 'hatena-bookmark:search', label: 'Search' },
      ],
      [
        'https://b.hatena.ne.jp/q/Android?%3Bdate_range=5y&%3Bsafe=on&%3Bsort=popular&%3Btarget=tag&%3Busers=3&mode=rss',
        { key: 'hatena-bookmark:search', label: 'Search' },
      ],
      [
        'https://b.hatena.ne.jp/q/nodejs/?mode=rss&sort=hot&threshold=3',
        { key: 'hatena-bookmark:search', label: 'Search' },
      ],
      [
        'https://b.hatena.ne.jp/site/0-designing.com?mode=rss',
        { key: 'hatena-bookmark:site', label: 'Site' },
      ],
      [
        'https://b.hatena.ne.jp/site/blog.livedoor.jp/itsoku?mode=rss',
        { key: 'hatena-bookmark:site', label: 'Site' },
      ],
      [
        'https://b.hatena.ne.jp/site/panathenaia.halfmoon.jp/?mode=rss&sort=eid&threshold=1',
        { key: 'hatena-bookmark:site', label: 'Site' },
      ],
      [
        'https://b.hatena.ne.jp/t-wada/bookmark.rss',
        { key: 'hatena-bookmark:bookmarks', label: 'Bookmarks' },
      ],
      [
        'https://b.hatena.ne.jp/site/bookmark.rss',
        { key: 'hatena-bookmark:bookmarks', label: 'Bookmarks' },
      ],
      [
        'https://b.hatena.ne.jp/efcl/bookmark.rss?tag=atom',
        { key: 'hatena-bookmark:bookmarks', label: 'Bookmarks' },
      ],
    ]

    it.each(ownFeedHints)('should return the hint of %s', (value, expected) => {
      expect(hatenaBookmarkHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a search page', () => {
      const value = 'https://b.hatena.ne.jp/q/rss?target=title'

      expect(hatenaBookmarkHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a site page', () => {
      const value = 'https://b.hatena.ne.jp/site/blog.livedoor.jp/itsoku?sort=eid'

      expect(hatenaBookmarkHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a user page', () => {
      const value = 'https://b.hatena.ne.jp/jkondo/bookmark'

      expect(hatenaBookmarkHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a site feed on another host', () => {
      const value = 'https://example.com/site/example.com?mode=rss'

      expect(hatenaBookmarkHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hot: DiscoverUriHint = { key: 'hatena-bookmark:hot', label: 'Hot entries' }
    const hotCategory: DiscoverUriHint = {
      key: 'hatena-bookmark:hot-category',
      label: 'Hot entries in category',
    }
    const fresh: DiscoverUriHint = { key: 'hatena-bookmark:new', label: 'New entries' }
    const freshCategory: DiscoverUriHint = {
      key: 'hatena-bookmark:new-category',
      label: 'New entries in category',
    }
    const search: DiscoverUriHint = { key: 'hatena-bookmark:search', label: 'Search' }
    const site: DiscoverUriHint = { key: 'hatena-bookmark:site', label: 'Site' }
    const bookmarks: DiscoverUriHint = { key: 'hatena-bookmark:bookmarks', label: 'Bookmarks' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://b.hatena.ne.jp/hotentry.rss', hot],
      ['https://b.hatena.ne.jp/hotentry/all.rss', hot],
      ['https://b.hatena.ne.jp/hotentry/life.rss', hotCategory],
      ['http://b.hatena.ne.jp/hotentry/life.rss', hotCategory],
      ['https://b.hatena.ne.jp/entrylist.rss', fresh],
      ['https://b.hatena.ne.jp/entrylist/all.rss', fresh],
      ['https://b.hatena.ne.jp/entrylist/entertainment.rss', freshCategory],
      ['http://b.hatena.ne.jp/entrylist/entertainment.rss', freshCategory],
      ['https://b.hatena.ne.jp/q/%E9%85%92?mode=rss', search],
      [
        'https://b.hatena.ne.jp/q/game?date_range=5y&mode=rss&safe=on&sort=popular&target=tag&users=5',
        search,
      ],
      ['https://b.hatena.ne.jp/site/blog.livedoor.jp/nwknews?mode=rss', site],
      ['https://b.hatena.ne.jp/site/bookmark.rss', bookmarks],
      [
        'https://b.hatena.ne.jp/yukatti/bookmark.rss?tag=%E4%BD%90%E8%97%A4%E4%BA%9C%E7%B4%80',
        bookmarks,
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [hatenaBookmarkHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
