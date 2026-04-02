import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/codeberg.js'

// Extracts the username from the path, excluding dots to avoid capturing
// feed extensions like .rss in Codeberg feed URLs (e.g., /user.rss).
const userRegex = /^\/([^/.]+)/

export const codebergHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
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
