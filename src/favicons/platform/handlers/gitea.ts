import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import {
  excludedPaths,
  hasResolvablePath,
  hosts,
  isGiteaHeaders,
} from '../../../feeds/platform/handlers/gitea.js'

// Extracts the username from the path, excluding dots to avoid capturing
// feed extensions like .rss in Gitea feed URLs (e.g., /user.rss).
const userRegex = /^\/([^/.]+)/

export const giteaHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    try {
      if (!hasResolvablePath(url)) {
        return false
      }

      if (isHostOf(url, hosts)) {
        return true
      }

      if (headers && isGiteaHeaders(headers)) {
        return true
      }
    } catch {}

    return false
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const match = pathname.match(userRegex)

    if (!match?.[1]) {
      return []
    }

    const username = match[1]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [{ uri: `${origin}/user/avatar/${username}/512` }]
  },
}
