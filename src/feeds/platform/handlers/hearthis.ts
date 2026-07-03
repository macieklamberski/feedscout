import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.
//
// hearthis.at/{user}/podcast.xml also serves the same feed.

const hosts = ['hearthis.at', 'www.hearthis.at']
const excludedPaths = [
  'about',
  'api',
  'feed',
  'login',
  'privacy',
  'search',
  'set',
  'signup',
  'terms',
]

export const hearthisHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://hearthis.at/${username}/podcast/`,
        hint: composeHint('hearthis:tracks'),
      },
    ]
  },
}
