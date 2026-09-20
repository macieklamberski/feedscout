import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Dailymotion exposes RSS 2.0 with MRSS at `/rss/trending`, `/rss/{user}`,
// `/rss/channel/{name}`, `/rss/playlist/{id}`, and `/rss/search/{query}`,
// but none of the user-facing pages advertise them via HTML
// `<link rel="alternate">` or HTTP Link headers. The handler is required
// to map homepage/trending, user, channel, playlist, and search URLs onto
// the corresponding `/rss/...` endpoints.

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

    // Playlist page: /playlist/{id}
    const playlistMatch = pathname.match(playlistRegex)

    if (playlistMatch?.[1]) {
      const playlistId = playlistMatch[1]

      return [
        {
          uri: `https://www.dailymotion.com/rss/playlist/${playlistId}`,
          hint: composeHint('dailymotion:playlist'),
        },
      ]
    }

    // Search results: /search/{query}
    const searchMatch = pathname.match(searchRegex)

    if (searchMatch?.[1]) {
      return [
        {
          uri: `https://www.dailymotion.com/rss/search/${searchMatch[1]}`,
          hint: composeHint('dailymotion:search'),
        },
      ]
    }

    // Channel page: /channel/{name}
    const channelMatch = pathname.match(channelRegex)

    if (channelMatch?.[1]) {
      return [
        {
          uri: `https://www.dailymotion.com/rss/channel/${channelMatch[1]}`,
          hint: composeHint('dailymotion:channel'),
        },
      ]
    }

    // User page: /{username}
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `https://www.dailymotion.com/rss/${username}`,
            hint: composeHint('dailymotion:videos'),
          },
        ]
      }
    }

    return []
  },
}
