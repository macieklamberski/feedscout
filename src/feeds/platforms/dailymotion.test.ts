import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { DailymotionUrl } from './dailymotion.js'
import { dailymotionHandler, parseDailymotionUrl } from './dailymotion.js'

describe('parseDailymotionUrl', () => {
  const shortSegmentValues: Array<string> = [
    'https://www.dailymotion.com/us',
    'https://www.dailymotion.com/FR',
    'https://www.dailymotion.com/us/',
  ]

  it.each(shortSegmentValues)(
    'should return undefined for a segment shorter than a username %s',
    (value) => {
      expect(parseDailymotionUrl(value)).toBeUndefined()
    },
  )

  it('should return the user for a page under the user segment', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'france24' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/user/france24')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'bfmtv' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/bfmtv')).toEqual(expected)
  })

  it('should return the user for the host without www', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'nasa' }

    expect(parseDailymotionUrl('https://dailymotion.com/nasa')).toEqual(expected)
  })

  it('should keep the username case', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'BFMTV' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/BFMTV')).toEqual(expected)
  })

  it('should return the playlist for a playlist page', () => {
    const expected: DailymotionUrl = { kind: 'playlist', playlistId: 'x7vjjm' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/playlist/x7vjjm')).toEqual(expected)
  })

  it('should return the playlist for a playlist page with a capitalized playlist segment', () => {
    const expected: DailymotionUrl = { kind: 'playlist', playlistId: 'x7vjjm' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/Playlist/x7vjjm')).toEqual(expected)
  })

  it('should return the playlist id cut at its first underscore', () => {
    const value = 'https://www.dailymotion.com/playlist/X7VJJM_BFM-Story_bfm-story'
    const expected: DailymotionUrl = { kind: 'playlist', playlistId: 'X7VJJM' }

    expect(parseDailymotionUrl(value)).toEqual(expected)
  })

  it('should return undefined for a playlist id that starts with an underscore', () => {
    expect(parseDailymotionUrl('https://www.dailymotion.com/playlist/_bfm-story')).toBeUndefined()
  })

  it('should return a one-character playlist id whole', () => {
    const expected: DailymotionUrl = { kind: 'playlist', playlistId: 'x' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/playlist/x')).toEqual(expected)
  })

  it('should return undefined for a playlist id with a dot', () => {
    expect(parseDailymotionUrl('https://www.dailymotion.com/playlist/xdf7sa.old')).toBeUndefined()
  })

  it('should return the channel for a channel page', () => {
    const expected: DailymotionUrl = { kind: 'channel', channel: 'news' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/channel/news')).toEqual(expected)
  })

  it('should return the channel for a channel page with a capitalized channel segment', () => {
    const expected: DailymotionUrl = { kind: 'channel', channel: 'news' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/Channel/news')).toEqual(expected)
  })

  it('should return a one-character channel whole', () => {
    const expected: DailymotionUrl = { kind: 'channel', channel: 'a' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/channel/a')).toEqual(expected)
  })

  it('should return undefined for a channel with a dot', () => {
    expect(parseDailymotionUrl('https://www.dailymotion.com/channel/news.tv')).toBeUndefined()
  })

  it('should return the query for a search page', () => {
    const expected: DailymotionUrl = { kind: 'search', query: 'cats' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/search/cats')).toEqual(expected)
  })

  it('should return the query for a search page with a capitalized search segment', () => {
    const expected: DailymotionUrl = { kind: 'search', query: 'cats' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/Search/cats')).toEqual(expected)
  })

  it('should return the user for a user page with a trailing slash', () => {
    const expected: DailymotionUrl = { kind: 'user', username: 'bfmtv' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/bfmtv/')).toEqual(expected)
  })

  it('should return undefined for a video page', () => {
    expect(parseDailymotionUrl('https://www.dailymotion.com/video/x8abc12')).toBeUndefined()
  })

  it('should return the trending page for the homepage', () => {
    const expected: DailymotionUrl = { kind: 'trending' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/')).toEqual(expected)
  })

  it('should return the trending page', () => {
    const expected: DailymotionUrl = { kind: 'trending' }

    expect(parseDailymotionUrl('https://www.dailymotion.com/Trending/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseDailymotionUrl('https://example.com/bfmtv')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseDailymotionUrl('not-a-url')).toBeUndefined()
  })
})

describe('dailymotionHandler', () => {
  describe('match', () => {
    it('should match Dailymotion URLs', () => {
      expect(dailymotionHandler.match('https://www.dailymotion.com/bfmtv')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(dailymotionHandler.match('https://example.com/dailymotion')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed for user page', () => {
      const value = 'https://www.dailymotion.com/bfmtv'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/bfmtv',
          hint: { key: 'dailymotion:videos', label: 'Videos' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed for playlist page', () => {
      const value = 'https://www.dailymotion.com/playlist/x7vjjm'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/playlist/x7vjjm',
          hint: { key: 'dailymotion:playlist', label: 'Playlist' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed for channel page', () => {
      const value = 'https://www.dailymotion.com/channel/news'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/channel/news',
          hint: { key: 'dailymotion:channel', label: 'Channel' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for homepage', () => {
      const value = 'https://www.dailymotion.com/'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: { key: 'dailymotion:trending', label: 'Trending' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending', () => {
      const value = 'https://www.dailymotion.com/trending'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: { key: 'dailymotion:trending', label: 'Trending' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending with a capitalized trending segment', () => {
      const value = 'https://www.dailymotion.com/Trending'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: { key: 'dailymotion:trending', label: 'Trending' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending with trailing slash', () => {
      const value = 'https://www.dailymotion.com/trending/'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: { key: 'dailymotion:trending', label: 'Trending' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return search feed for /search/{query}', () => {
      const value = 'https://www.dailymotion.com/search/cats'
      const expected = [
        {
          uri: 'https://www.dailymotion.com/rss/search/cats',
          hint: { key: 'dailymotion:search', label: 'Search' },
        },
      ]

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })

    it('should return no feeds for a video page', () => {
      const value = 'https://www.dailymotion.com/video/x8abc12'
      const expected: Array<DiscoverUriEntry> = []

      expect(dailymotionHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the videos hint for a user feed', () => {
      const value = 'https://www.dailymotion.com/rss/alicetv'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a user feed with an underscore', () => {
      const value = 'https://www.dailymotion.com/rss/bob_official'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a feed on the host without www', () => {
      const value = 'https://dailymotion.com/rss/alicetv'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a feed over http', () => {
      const value = 'http://www.dailymotion.com/rss/alicetv'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a feed with a trailing slash', () => {
      const value = 'https://www.dailymotion.com/rss/alicetv/'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a feed with a capitalized route', () => {
      const value = 'https://www.dailymotion.com/RSS/alicetv'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a legacy user feed', () => {
      const value = 'https://www.dailymotion.com/rss/user/CarolNews'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the playlist hint for a playlist feed', () => {
      const value = 'https://www.dailymotion.com/rss/playlist/x5rwtk'
      const expected: DiscoverUriHint = { key: 'dailymotion:playlist', label: 'Playlist' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the playlist hint for a playlist feed with a capitalized route', () => {
      const value = 'https://www.dailymotion.com/rss/Playlist/x7buf3'
      const expected: DiscoverUriHint = { key: 'dailymotion:playlist', label: 'Playlist' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the search hint for a search feed', () => {
      const value = 'https://www.dailymotion.com/rss/search/cats'
      const expected: DiscoverUriHint = { key: 'dailymotion:search', label: 'Search' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channel hint for a channel feed', () => {
      const value = 'https://www.dailymotion.com/rss/channel/news'
      const expected: DiscoverUriHint = { key: 'dailymotion:channel', label: 'Channel' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the trending hint for the trending feed', () => {
      const value = 'https://www.dailymotion.com/rss/trending'
      const expected: DiscoverUriHint = { key: 'dailymotion:trending', label: 'Trending' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a legacy user feed with a page', () => {
      const value = 'https://www.dailymotion.com/rss/user/alice/1/'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the videos hint for a legacy user feed with enclosures', () => {
      const value = 'https://www.dailymotion.com/rss/user/alice/1?withEnclosure=1'
      const expected: DiscoverUriHint = { key: 'dailymotion:videos', label: 'Videos' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the playlist hint for a playlist feed with a page', () => {
      const value = 'https://www.dailymotion.com/rss/playlist/x5rwtk_example/1/'
      const expected: DiscoverUriHint = { key: 'dailymotion:playlist', label: 'Playlist' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the search hint for a sorted search feed in one language', () => {
      const value = 'https://www.dailymotion.com/rss/relevance/lang/es/search/cats/0?af=1'
      const expected: DiscoverUriHint = { key: 'dailymotion:search', label: 'Search' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group hint for a group feed', () => {
      const value = 'https://www.dailymotion.com/rss/group/12345/1?withEnclosure=1'
      const expected: DiscoverUriHint = { key: 'dailymotion:group', label: 'Group' }

      expect(dailymotionHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a user page', () => {
      const value = 'https://www.dailymotion.com/alicetv'

      expect(dailymotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a playlist page', () => {
      const value = 'https://www.dailymotion.com/playlist/x5rwtk'

      expect(dailymotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a video page', () => {
      const value = 'https://www.dailymotion.com/video/x8abc12'

      expect(dailymotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the rss path alone', () => {
      const value = 'https://www.dailymotion.com/rss'

      expect(dailymotionHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss/alicetv'

      expect(dailymotionHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://www.dailymotion.com/rss/alicetv', { key: 'dailymotion:videos', label: 'Videos' }],
      [
        'https://www.dailymotion.com/rss/user/CarolNews',
        { key: 'dailymotion:videos', label: 'Videos' },
      ],
      [
        'https://www.dailymotion.com/rss/playlist/x5rwtk',
        { key: 'dailymotion:playlist', label: 'Playlist' },
      ],
      [
        'https://www.dailymotion.com/rss/search/cats',
        { key: 'dailymotion:search', label: 'Search' },
      ],
      [
        'https://www.dailymotion.com/rss/channel/news',
        { key: 'dailymotion:channel', label: 'Channel' },
      ],
      [
        'https://www.dailymotion.com/rss/trending',
        { key: 'dailymotion:trending', label: 'Trending' },
      ],
      [
        'https://www.dailymotion.com/rss/user/alice/1',
        { key: 'dailymotion:videos', label: 'Videos' },
      ],
      [
        'https://www.dailymotion.com/rss/playlist/x5rwtk/1/',
        { key: 'dailymotion:playlist', label: 'Playlist' },
      ],
      [
        'https://www.dailymotion.com/rss/relevance/lang/es/search/cats/0/?af=1',
        { key: 'dailymotion:search', label: 'Search' },
      ],
      [
        'https://www.dailymotion.com/rss/group/12345/1',
        { key: 'dailymotion:group', label: 'Group' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [dailymotionHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
