import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Partially discoverable without handler.

const hosts = ['buttondown.com', 'www.buttondown.com']
const excludedPaths = [
  'about',
  'api',
  'blog',
  'changelog',
  'docs',
  'features',
  'help',
  'legal',
  'login',
  'pricing',
  'privacy',
  'refer',
  'register',
  'settings',
  'terms',
]

export const buttondownHandler: PlatformHandler = {
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
        uri: `https://buttondown.com/${username}/rss`,
        hint: composeHint('buttondown:newsletter'),
      },
    ]
  },
}
