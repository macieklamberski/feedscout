import { acomics } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: issues.
// Handler needed for: subscriptions.

export type AcomicsUrl = { kind: 'comic'; comic: string } | { kind: 'user'; username: string }

const feeds = withHintLabels(acomics.feeds)

// A comic lives under /~{comic} and a user under /-{user}, and both keep their case in the feed
// URL, since /~thesweetberries/rss answers 404 where /~TheSweetBerries/rss serves the comic.
export const parseAcomicsUrl = (url: string): AcomicsUrl | undefined => {
  const page = acomics.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'comic') {
    return { kind: 'comic', comic: page.params.comic }
  }

  return { kind: 'user', username: page.params.username }
}

export const acomicsHandler: PlatformHandler = {
  match: (url) => {
    return parseAcomicsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAcomicsUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'comic') {
      return [feeds.getFeedEntry('issues', { comic: parsed.comic })]
    }

    return [feeds.getFeedEntry('subscriptions', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
