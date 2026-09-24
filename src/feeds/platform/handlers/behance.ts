import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

export const hosts = ['behance.net', 'www.behance.net']
export const userRegex = /^\/([a-zA-Z0-9_-]+)(?:\/(appreciated))?\/?$/
export const excludedPaths = [
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

    // Homepage: featured projects. The page's own FeedBurner link serves the same items.
    if (pathname === '/' || pathname === '' || pathname === '/galleries') {
      return [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: composeHint('behance:projects'),
        },
      ]
    }

    // User profile: /{username} or /{username}/appreciated
    const userMatch = pathname.match(userRegex)

    // The appreciated page gets the portfolio feed: Behance ignores
    // `content=appreciated` and serves the user's own projects for it.
    if (userMatch?.[1]) {
      const username = userMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `https://www.behance.net/feeds/user?username=${username}`,
            hint: composeHint('behance:portfolio'),
          },
        ]
      }
    }

    return []
  },
}
