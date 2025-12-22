import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['dailymotion.com', 'www.dailymotion.com']
const userPathRegex = /^\/([a-zA-Z0-9_-]+)$/
const playlistPathRegex = /^\/playlist\/([a-zA-Z0-9]+)/
const excludedPaths = [
  'signin',
  'signout',
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
      const username = userMatch[1].toLowerCase()

      if (!excludedPaths.includes(username)) {
        return [`https://www.dailymotion.com/rss/user/${username}`]
      }
    }

    return []
  },
}
