import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/github.js'

// Extracts the username from the path, excluding dots to avoid capturing
// feed extensions like .atom in GitHub feed URLs (e.g., /user.atom).
const userRegex = /^\/([^/.]+)/

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(userRegex)

    if (!match?.[1]) {
      return []
    }

    const user = match[1]

    if (isAnyOf(user, excludedPaths)) {
      return []
    }

    return [{ uri: `https://github.com/${user}.png` }]
  },
}
