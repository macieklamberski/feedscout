import { cratesIo } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: new-crates, releases, updates.

export type CratesIoUrl = { kind: 'crate'; crate: string } | { kind: 'home' }

const hosts = cratesIo.hosts.exact

const crateRegex = /^\/crates\/([\w-]+)(?:\/|$)/i

const feeds = withHintLabels(cratesIo.feeds)

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

    // The new crates and updates feeds need no value from the page, so every page builds them after
    // its own feeds. The feed path takes the crate name in its canonical case and separator, and
    // any other spelling answers 403, while the page URL accepts both.
    if (parsed.kind === 'crate') {
      return [
        feeds.getFeedEntry('releases', { crate: parsed.crate }),
        feeds.getFeedEntry('new-crates'),
        feeds.getFeedEntry('updates'),
      ]
    }

    return [feeds.getFeedEntry('new-crates'), feeds.getFeedEntry('updates')]
  },

  getFeedHint: feeds.getFeedHint,
}
