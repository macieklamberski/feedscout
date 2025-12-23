import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['dailymotion.com', 'www.dailymotion.com']
const userPathRegex = /^\/([a-zA-Z0-9_-]+)$/
const playlistPathRegex = /^\/playlist\/([a-zA-Z0-9_-]+)/
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

    // Playlist page: /playlist/{id}
    const playlistMatch = pathname.match(playlistPathRegex)

    if (playlistMatch?.[1]) {
      const playlistId = playlistMatch[1]

      return [`https://www.dailymotion.com/rss/playlist/${playlistId}`]
    }

    // User/channel page: /{username}
    const userMatch = pathname.match(userPathRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [`https://www.dailymotion.com/rss/${username}`]
      }
    }

    return []
  },
}
