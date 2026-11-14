import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type CratesIoUrl = { kind: 'crate'; crate: string } | { kind: 'home' }

const hosts = ['crates.io', 'www.crates.io']

const crateRegex = /^\/crates\/([\w-]+)(?:\/|$)/i

const feeds = definePlatformFeeds([
  { key: 'crates-io:releases', template: 'https://static.crates.io/rss/crates/{crate}.xml' },
  { key: 'crates-io:new-crates', template: 'https://static.crates.io/rss/crates.xml' },
  { key: 'crates-io:updates', template: 'https://static.crates.io/rss/updates.xml' },
])

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
      return [feeds.getFeedEntry('crates-io:releases', { crate: parsed.crate })]
    }

    return [feeds.getFeedEntry('crates-io:new-crates'), feeds.getFeedEntry('crates-io:updates')]
  },

  getFeedHint: feeds.getFeedHint,
}
