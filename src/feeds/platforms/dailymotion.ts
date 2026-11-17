import { dailymotion } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabel, withHintLabels } from '../../common/uris/platform/feeds.js'
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

const hosts = dailymotion.hosts.exact

// The older /user/{name} address still serves the same page.
// length: keeps a two-letter country home page out, as /fr serves the site-wide feed
const userRegex = /^\/(?:user\/)?([a-zA-Z0-9_-]{3,})\/?$/i
const playlistRegex = /^\/playlist\/(?<playlistId>[^/]+)/i
const channelRegex = /^\/channel\/(?<channel>[^/]+)/i
const searchRegex = /^\/search\/([^/]+)/i
const trendingRegex = /^\/(?:trending\/?)?$/i

const feeds = withHintLabels(dailymotion.feeds)

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

  // A share url appends a `_title-slug` to the id, and the feed answers with it as well.
  const playlistId = pathname.match(playlistRegex)?.groups?.playlistId

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

    // The trending feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'trending') {
      return [feeds.getFeedEntry('dailymotion:trending')]
    }

    if (parsed.kind === 'playlist') {
      return [
        feeds.getFeedEntry('dailymotion:playlist', { id: parsed.playlistId }),
        feeds.getFeedEntry('dailymotion:trending'),
      ]
    }

    if (parsed.kind === 'search') {
      return [
        feeds.getFeedEntry('dailymotion:search', { query: parsed.query }),
        feeds.getFeedEntry('dailymotion:trending'),
      ]
    }

    if (parsed.kind === 'channel') {
      return [
        feeds.getFeedEntry('dailymotion:channel', { channel: parsed.channel }),
        feeds.getFeedEntry('dailymotion:trending'),
      ]
    }

    return [
      feeds.getFeedEntry('dailymotion:videos', { username: parsed.username }),
      feeds.getFeedEntry('dailymotion:trending'),
    ]
  },

  getFeedHint: (url) => withHintLabel(dailymotion.getFeedHint(url)),
}
