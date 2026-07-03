import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

// buttondown.email is the legacy primary domain (still 302-redirects to .com).
const hosts = ['buttondown.com', 'www.buttondown.com', 'buttondown.email', 'www.buttondown.email']
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
