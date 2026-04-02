import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

const tagPattern = /^\/tag\/([^/]+)/
const favouritesPattern = /^\/([a-zA-Z0-9_-]+)\/favourites\/?$/
const folderPattern = /^\/([a-zA-Z0-9_-]+)\/gallery\/(\d+)(?:\/|$)/
const profilePattern = /^\/([a-zA-Z0-9_-]+)(?:\/gallery(?:\/all)?)?(?:\/|$)/

export const hosts = ['deviantart.com', 'www.deviantart.com']
const feedBaseUrl = 'https://backend.deviantart.com/rss.xml'
export const excludedPaths = [
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
    const tagMatch = pathname.match(tagPattern)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [
        {
          uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`tag:${tag}`)}`,
          hint: composeHint('deviantart:tag'),
        },
      ]
    }

    // Match favourites: /{username}/favourites
    const favMatch = pathname.match(favouritesPattern)

    if (favMatch?.[1]) {
      const username = favMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`favby:${username}`)}`,
            hint: composeHint('deviantart:favorites'),
          },
        ]
      }
    }

    // Match gallery folder: /{username}/gallery/{folder-id}/{folder-name}.
    const folderMatch = pathname.match(folderPattern)

    if (folderMatch?.[1] && folderMatch?.[2]) {
      const username = folderMatch[1]
      const folderId = folderMatch[2]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`gallery:${username}/${folderId}`)}`,
            hint: composeHint('deviantart:gallery'),
          },
        ]
      }
    }

    // Match username from profile/gallery paths like:
    // /{username}
    // /{username}/gallery
    // /{username}/gallery/all
    const userMatch = pathname.match(profilePattern)
    const username = userMatch?.[1]

    if (!username || isAnyOf(username, excludedPaths)) {
      return []
    }

    // Build RSS feed URL with query for user's deviations sorted by time.
    const query = `by:${username} sort:time meta:all`

    return [
      {
        uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(query)}`,
        hint: composeHint('deviantart:deviations'),
      },
    ]
  },
}
