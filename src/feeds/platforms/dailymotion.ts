import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, wordOrHyphenRegex } from '../../common/utils.js'

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

  const playlistId = pathname.match(playlistRegex)?.groups?.playlistId

  if (playlistId && wordOrHyphenRegex.test(playlistId)) {
    return { kind: 'playlist', playlistId }
  }

  const query = pathname.match(searchRegex)?.[1]

  if (query) {
    return { kind: 'search', query }
  }

  const channel = pathname.match(channelRegex)?.groups?.channel

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
      return [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: composeHint('dailymotion:trending'),
        },
      ]
    }

    if (parsed.kind === 'playlist') {
      return [
        {
          uri: `https://www.dailymotion.com/rss/playlist/${parsed.playlistId}`,
          hint: composeHint('dailymotion:playlist'),
        },
      ]
    }

    if (parsed.kind === 'search') {
      return [
        {
          uri: `https://www.dailymotion.com/rss/search/${parsed.query}`,
          hint: composeHint('dailymotion:search'),
        },
      ]
    }

    if (parsed.kind === 'channel') {
      return [
        {
          uri: `https://www.dailymotion.com/rss/channel/${parsed.channel}`,
          hint: composeHint('dailymotion:channel'),
        },
      ]
    }

    return [
      {
        uri: `https://www.dailymotion.com/rss/${parsed.username}`,
        hint: composeHint('dailymotion:videos'),
      },
    ]
  },
}
