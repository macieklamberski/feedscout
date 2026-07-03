import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['are.na', 'www.are.na']
const excludedPaths = [
  'about',
  'api',
  'explore',
  'login',
  'premium',
  'privacy',
  'search',
  'settings',
  'signup',
  'support',
  'terms',
]

export const arenaHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    // Editorial section: /editorial[/{article-slug}] resolves to the dedicated
    // editorial feed (article-slug pages have no per-article feed).
    if (pathSegments[0] === 'editorial') {
      return [
        {
          uri: 'https://www.are.na/editorial/feed/rss',
          hint: composeHint('arena:editorial'),
        },
      ]
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    if (pathSegments[1]) {
      return [
        {
          uri: `https://www.are.na/${username}/${pathSegments[1]}/feed/rss`,
          hint: composeHint('arena:channel'),
        },
      ]
    }

    return [
      {
        uri: `https://www.are.na/${username}/feed/rss`,
        hint: composeHint('arena:profile'),
      },
    ]
  },
}
