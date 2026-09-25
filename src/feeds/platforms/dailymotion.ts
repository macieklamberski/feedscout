import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type DailymotionUrl =
  | { kind: 'user'; username: string }
  | { kind: 'playlist'; playlistId: string }
  | { kind: 'channel'; channel: string }
  | { kind: 'search'; query: string }

const hosts = ['dailymotion.com', 'www.dailymotion.com']
const userRegex = /^\/([a-zA-Z0-9_-]+)$/
const playlistRegex = /^\/playlist\/([a-zA-Z0-9_-]+)/
const channelRegex = /^\/channel\/([a-zA-Z0-9_-]+)/
const searchRegex = /^\/search\/([^/]+)/
const excludedPaths = [
  'signin',
  'signout',
  'signup',
  'login',
  'logout',
  'register',
  'search',
  'legal',
  'about',
  'careers',
  'terms',
  'privacy',
  'feedback',
  'help',
  'settings',
  'upload',
  'partner',
  'monetize',
  'studio',
  'video',
  'live',
  'channels',
  'playlist',
  'topics',
  'trending',
  'dm',
  'creator',
  'premium',
  'explore',
  'following',
  'subscriptions',
  'notifications',
  'history',
  'watch',
  'contact',
  'ads',
  'dmca',
  'copyright',
  'community',
]

export const parseDailymotionUrl = (url: string): DailymotionUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const playlistId = pathname.match(playlistRegex)?.[1]

  if (playlistId) {
    return { kind: 'playlist', playlistId }
  }

  const query = pathname.match(searchRegex)?.[1]

  if (query) {
    return { kind: 'search', query }
  }

  const channel = pathname.match(channelRegex)?.[1]

  if (channel) {
    return { kind: 'channel', channel }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'user', username }
}

export const dailymotionHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Homepage or /trending: global trending feed.
    if (pathname === '/' || pathname === '' || pathname === '/trending') {
      return [
        {
          uri: 'https://www.dailymotion.com/rss/trending',
          hint: composeHint('dailymotion:trending'),
        },
      ]
    }

    const parsed = parseDailymotionUrl(url)

    if (parsed?.kind === 'playlist') {
      return [
        {
          uri: `https://www.dailymotion.com/rss/playlist/${parsed.playlistId}`,
          hint: composeHint('dailymotion:playlist'),
        },
      ]
    }

    if (parsed?.kind === 'search') {
      return [
        {
          uri: `https://www.dailymotion.com/rss/search/${parsed.query}`,
          hint: composeHint('dailymotion:search'),
        },
      ]
    }

    if (parsed?.kind === 'channel') {
      return [
        {
          uri: `https://www.dailymotion.com/rss/channel/${parsed.channel}`,
          hint: composeHint('dailymotion:channel'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://www.dailymotion.com/rss/${parsed.username}`,
          hint: composeHint('dailymotion:videos'),
        },
      ]
    }

    return []
  },
}
