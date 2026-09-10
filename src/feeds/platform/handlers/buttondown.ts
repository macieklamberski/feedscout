import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Buttondown newsletter archives at `buttondown.com/{user}` (and the legacy
// `buttondown.email/{user}` host that 302-redirects to the current domain)
// expose a single RSS feed at `/{user}/rss`. The newsletter homepage
// advertises this URL via standard `<link rel="alternate">` autodiscovery.
// The handler maps both the current and legacy hosts onto the canonical
// `buttondown.com/{user}/rss` URL so old archive links resolve directly, and
// excludes non-newsletter top-level paths (`docs`, `pricing`, `login`, etc.).
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
