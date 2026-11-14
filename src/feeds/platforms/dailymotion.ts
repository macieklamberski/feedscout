import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type DailymotionUrl =
  | { kind: 'user'; username: string }
  | { kind: 'playlist'; playlistId: string }
  | { kind: 'channel'; channel: string }
  | { kind: 'search'; query: string }
  | { kind: 'trending' }

const hosts = ['dailymotion.com', 'www.dailymotion.com']

// The older /user/{name} address still serves the same page.
// length: keeps a two-letter country home page out, as /fr serves the site-wide feed
const userRegex = /^\/(?:user\/)?([a-zA-Z0-9_-]{3,})\/?$/i
const playlistRegex = /^\/playlist\/(?<playlistId>[^/]+)/i
const channelRegex = /^\/channel\/(?<channel>[^/]+)/i
const searchRegex = /^\/search\/([^/]+)/i
const trendingRegex = /^\/(?:trending\/?)?$/i

// `/rss/trending` reads before `/rss/{username}`, so a user named trending gets that feed.
const feeds = definePlatformFeeds([
  { key: 'dailymotion:trending', template: 'https://www.dailymotion.com/rss/trending' },
  { key: 'dailymotion:playlist', template: 'https://www.dailymotion.com/rss/playlist/{id}' },
  { key: 'dailymotion:search', template: 'https://www.dailymotion.com/rss/search/{query}' },
  { key: 'dailymotion:channel', template: 'https://www.dailymotion.com/rss/channel/{channel}' },
  { key: 'dailymotion:videos', template: 'https://www.dailymotion.com/rss/{username}' },
  {
    key: 'dailymotion:videos',
    template: 'https://www.dailymotion.com/rss/user/{username}',
    isAlias: true,
  },
  // The legacy routes take a page number, and the first page serves the same videos as the feed
  // without one. A search there also names its sort and language.
  {
    key: 'dailymotion:videos',
    template: 'https://www.dailymotion.com/rss/user/{username}/{page}',
  },
  { key: 'dailymotion:playlist', template: 'https://www.dailymotion.com/rss/playlist/{id}/{page}' },
  {
    key: 'dailymotion:search',
    template: 'https://www.dailymotion.com/rss/{sort}/lang/{language}/search/{query}/{page}',
  },
  // A group feed, which no page links since groups left the site.
  { key: 'dailymotion:group', template: 'https://www.dailymotion.com/rss/group/{id}/{page}' },
])

export const parseDailymotionUrl = (url: string): DailymotionUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl

  // Homepage or /trending: global trending feed.
  if (trendingRegex.test(pathname)) {
    return { kind: 'trending' }
  }

  // A share url appends a `_title-slug` to the id, which the feed and the api ignore.
  const playlistId = pathname.match(playlistRegex)?.groups?.playlistId?.split('_')[0]

  if (playlistId && wordOrHyphenRegex.test(playlistId)) {
    return { kind: 'playlist', playlistId }
  }

  const query = pathname.match(searchRegex)?.[1]

  if (query) {
    return { kind: 'search', query }
  }

  const channel = pathname.match(channelRegex)?.groups?.channel

  // A channel outside [\w-], such as news.tv, has no /rss/channel/ feed: it answers 404.
  if (channel && wordOrHyphenRegex.test(channel)) {
    return { kind: 'channel', channel }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'user', username }
}

export const dailymotionHandler: PlatformHandler = {
  match: (url) => {
    return parseDailymotionUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDailymotionUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'trending') {
      return [feeds.getFeedEntry('dailymotion:trending')]
    }

    if (parsed.kind === 'playlist') {
      return [feeds.getFeedEntry('dailymotion:playlist', { id: parsed.playlistId })]
    }

    if (parsed.kind === 'search') {
      return [feeds.getFeedEntry('dailymotion:search', { query: parsed.query })]
    }

    if (parsed.kind === 'channel') {
      return [feeds.getFeedEntry('dailymotion:channel', { channel: parsed.channel })]
    }

    return [feeds.getFeedEntry('dailymotion:videos', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
