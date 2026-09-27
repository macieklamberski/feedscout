import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['crates.io', 'www.crates.io']

const crateRegex = /^\/crates\/([\w-]+)(?:\/|$)/i

export const cratesIoHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const crate = pathname.match(crateRegex)?.[1]

    // The feed path takes the crate name in its canonical case and separator, and any other
    // spelling answers 403, while the page URL accepts both.
    if (crate) {
      return [
        {
          uri: `https://static.crates.io/rss/crates/${crate}.xml`,
          hint: composeHint('crates-io:releases'),
        },
      ]
    }

    if (pathname === '/') {
      return [
        {
          uri: 'https://static.crates.io/rss/crates.xml',
          hint: composeHint('crates-io:new-crates'),
        },
        {
          uri: 'https://static.crates.io/rss/updates.xml',
          hint: composeHint('crates-io:updates'),
        },
      ]
    }

    return []
  },
}
