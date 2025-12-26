import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['behance.net', 'www.behance.net']
const userPathRegex = /^\/([a-zA-Z0-9_-]+)(?:\/(appreciated))?\/?$/
const excludedPaths = [
  'search',
  'galleries',
  'curated',
  'features',
  'live',
  'joblist',
  'hire',
  'blog',
  'about',
  'privacy',
  'tos',
  'help',
  'onboarding',
  'settings',
  'notifications',
  'messages',
  'adobe',
]

export const behanceHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // User profile: /{username} or /{username}/appreciated
    const userMatch = pathname.match(userPathRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]
      const subpage = userMatch[2]

      if (!isAnyOf(username, excludedPaths)) {
        if (subpage === 'appreciated') {
          return [`https://www.behance.net/feeds/user?username=${username}&content=appreciated`]
        }

        return [`https://www.behance.net/feeds/user?username=${username}`]
      }
    }

    return []
  },
}
