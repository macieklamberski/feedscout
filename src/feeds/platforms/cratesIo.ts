import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type CratesIoUrl = { kind: 'crate'; crate: string } | { kind: 'home' }

const hosts = ['crates.io', 'www.crates.io']

const crateRegex = /^\/crates\/([\w-]+)(?:\/|$)/i

export const parseCratesIoUrl = (url: string): CratesIoUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  const crate = pathname.match(crateRegex)?.[1]

  if (crate) {
    return { kind: 'crate', crate }
  }

  if (pathname === '/') {
    return { kind: 'home' }
  }
}

export const cratesIoHandler: PlatformHandler = {
  match: (url) => {
    return parseCratesIoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCratesIoUrl(url)

    if (!parsed) {
      return []
    }

    // The feed path takes the crate name in its canonical case and separator, and any other
    // spelling answers 403, while the page URL accepts both.
    if (parsed.kind === 'crate') {
      return [
        {
          uri: `https://static.crates.io/rss/crates/${parsed.crate}.xml`,
          hint: composeHint('crates-io:releases'),
        },
      ]
    }

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
  },
}
