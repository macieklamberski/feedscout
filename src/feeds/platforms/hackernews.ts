import { hackernews } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: front.
// Handler needed for: front-full, show.

export type HackernewsUrl = { kind: 'show' } | { kind: 'home' }

const hosts = hackernews.hosts.exact

const showRegex = /^\/show(?:new)?\/?$/i

const feeds = withHintLabels(hackernews.feeds)

export const parseHackernewsUrl = (url: string): HackernewsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  if (showRegex.test(new URL(url).pathname)) {
    return { kind: 'show' }
  }

  return { kind: 'home' }
}

export const hackernewsHandler: PlatformHandler = {
  match: (url) => {
    return parseHackernewsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHackernewsUrl(url)

    if (!parsed) {
      return []
    }

    // Every feed needs no value from the page, so every page builds them, its own first.
    if (parsed.kind === 'show') {
      return [
        feeds.getFeedEntry('show'),
        feeds.getFeedEntry('front'),
        feeds.getFeedEntry('front-full'),
      ]
    }

    return [
      feeds.getFeedEntry('front'),
      feeds.getFeedEntry('show'),
      feeds.getFeedEntry('front-full'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
