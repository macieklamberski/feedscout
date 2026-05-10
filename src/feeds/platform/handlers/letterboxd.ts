import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['letterboxd.com', 'www.letterboxd.com']
const excludedPaths = [
  'about',
  'activity',
  'api-beta',
  'apps',
  'contact',
  'create-account',
  'films',
  'journal',
  'legal',
  'lists',
  'members',
  'news',
  'pro',
  'search',
  'settings',
  'showdown',
  'sign-in',
  'welcome',
  'year-in-review',
]

export const letterboxdHandler: PlatformHandler = {
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
        uri: `https://letterboxd.com/${username}/rss/`,
        hint: composeHint('letterboxd:diary'),
      },
    ]
  },
}
