import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf } from '../../../common/utils.js'

const hosts = ['deviantart.com', 'www.deviantart.com']

const feedBaseUrl = 'https://backend.deviantart.com/rss.xml'

export const deviantartHandler: PlatformHandler = {
  match: (url) => {
    return isAnyOf(new URL(url).hostname, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Match username from profile/gallery paths like:
    // /{username}
    // /{username}/gallery
    // /{username}/gallery/all
    // /{username}/gallery/{folder-id}/{folder-name}
    const userMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)(?:\/gallery)?(?:\/|$)/)

    if (!userMatch?.[1]) {
      return []
    }

    const username = userMatch[1]

    // Exclude system paths.
    const systemPaths = [
      'about',
      'join',
      'search',
      'tag',
      'topic',
      'watch',
      'notifications',
      'settings',
      'submit',
      'shop',
      'core-membership',
      'team',
      'developers',
    ]

    if (systemPaths.includes(username.toLowerCase())) {
      return []
    }

    // Build RSS feed URL with query for user's deviations sorted by time.
    const query = `by:${username} sort:time meta:all`

    return [`${feedBaseUrl}?type=deviation&q=${encodeURIComponent(query)}`]
  },
}
