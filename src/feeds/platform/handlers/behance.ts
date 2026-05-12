import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Behance exposes featured projects at `behance.net/feeds/projects`, the
// Featured-by-Adobe gallery via FeedBurner at
// `feeds.feedburner.com/behance/vorr`, and per-user portfolio and appreciated
// feeds via `behance.net/feeds/user?username={user}[&content=appreciated]`.
// HTML autodiscovery on every behance.net page returns only the generic
// FeedBurner site feed regardless of which profile is being viewed, so
// per-user feeds are not reachable via `<link rel="alternate">`.
// The handler is the only path to per-user portfolio/appreciated feeds and
// also surfaces the homepage and `/galleries` pair (projects + featured).

const hosts = ['behance.net', 'www.behance.net']
const userRegex = /^\/([a-zA-Z0-9_-]+)(?:\/(appreciated))?\/?$/
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

    // Homepage: featured projects feed + Featured-by-Adobe gallery.
    if (pathname === '/' || pathname === '' || pathname === '/galleries') {
      return [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: composeHint('behance:projects'),
        },
        {
          uri: 'https://feeds.feedburner.com/behance/vorr',
          hint: composeHint('behance:featured'),
        },
      ]
    }

    // User profile: /{username} or /{username}/appreciated
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]
      const subpage = userMatch[2]

      if (!isAnyOf(username, excludedPaths)) {
        if (subpage === 'appreciated') {
          return [
            {
              uri: `https://www.behance.net/feeds/user?username=${username}&content=appreciated`,
              hint: composeHint('behance:appreciated'),
            },
          ]
        }

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
