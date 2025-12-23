import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['deviantart.com', 'www.deviantart.com']
const feedBaseUrl = 'https://backend.deviantart.com/rss.xml'
const excludedPaths = [
  'about',
  'join',
  'search',
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

export const deviantartHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Match tag page: /tag/{tagname}
    const tagMatch = pathname.match(/^\/tag\/([^/]+)/)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [`${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`tag:${tag}`)}`]
    }

    // Match favourites: /{username}/favourites
    const favMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)\/favourites\/?$/)

    if (favMatch?.[1]) {
      const username = favMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [`${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`favby:${username}`)}`]
      }
    }

    // Match gallery folder: /{username}/gallery/{folder-id}/{folder-name}.
    const folderMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)\/gallery\/(\d+)(?:\/|$)/)

    if (folderMatch?.[1] && folderMatch?.[2]) {
      const username = folderMatch[1]
      const folderId = folderMatch[2]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`gallery:${username}/${folderId}`)}`,
        ]
      }
    }

    // Match username from profile/gallery paths like:
    // /{username}
    // /{username}/gallery
    // /{username}/gallery/all
    const userMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)(?:\/gallery(?:\/all)?)?(?:\/|$)/)
    const username = userMatch?.[1]

    if (!username || isAnyOf(username, excludedPaths)) {
      return []
    }

    // Build RSS feed URL with query for user's deviations sorted by time.
    const query = `by:${username} sort:time meta:all`

    return [`${feedBaseUrl}?type=deviation&q=${encodeURIComponent(query)}`]
  },
}
